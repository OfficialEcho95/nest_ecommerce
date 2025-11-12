import { Worker } from 'bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisServer } from 'redisServer';
import { Shipment, ShipmentStatus } from 'src/modules/shipment/entity/shipment.entity';
import { Order } from '../../../modules/orders/entities/order.entity';
import { transporter } from 'nodemailer.setup';


@Injectable()
export class ShipmentWorker {
    private worker: Worker;

    constructor(
        private readonly redisServer: RedisServer,
        @InjectRepository(Shipment)
        private readonly shipmentRepo: Repository<Shipment>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
    ) {
        // Bind the processor to the class context
        this.worker = new Worker(
            'shipment',
            this.processJob.bind(this),
            { connection: this.redisServer.getConnection() },
        );

        this.registerListeners();
    }

    private registerListeners() {
        this.worker.on('completed', job => {
            console.log(`✅ Shipment job "${job.name}" completed for shipment ID: ${job.data.shipmentId}`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`❌ Shipment job "${job?.name}" failed: ${err.message}`);
        });
    }

    // Processor method
    private async processJob(job) {
        switch (job.name) {
            case 'process-shipment':
                return this.handleEmailToUser(job.data);
            case 'confirm-delivery':
                return this.confirmDelivery(job.data);
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }

    async handleEmailToUser({ orderId, shipmentId }) {
        const shipment = await this.shipmentRepo.findOne({
            where: { id: shipmentId },
            relations: ['order', 'order.user'],
        });
        if (!shipment) throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);

        const { user } = shipment.order;
        await transporter.sendMail({
            from: `"Nest E-Commerce" <${process.env.MAIL_USER}>`,
            to: user.email,
            subject: `📦 Your order #${orderId} has been shipped!`,
            html: `
                <h2>Good news, ${user.firstname || 'customer'}!</h2>
                <p>Your order <b>#${orderId}</b> has been shipped via <b>${shipment.courier}</b>.</p>
                <p><b>Tracking Number:</b> ${shipment.trackingNumber}</p>
                <p>You can expect delivery soon to: <b>${shipment.address}</b></p>
            `,
        });
        console.log('Email sent for product shipment');
    }

    async confirmDelivery({ orderId, shipmentId }) {
        const shipment = await this.shipmentRepo.findOne({
            where: { id: shipmentId },
            relations: ['order', 'order.user'],
        });
        if (!shipment) throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);

        shipment.status = ShipmentStatus.DELIVERED;
        await this.shipmentRepo.save(shipment);

        shipment.order.status = 'DELIVERED';
        await this.orderRepo.save(shipment.order);

        await transporter.sendMail({
            from: `"Nest E-Commerce" <${process.env.MAIL_USER}>`,
            to: shipment.order.user.email,
            subject: `🎉 Order #${orderId} Delivered Successfully`,
            html: `
                <h2>Order Delivered!</h2>
                <p>Your order <b>#${orderId}</b> has been successfully delivered.</p>
                <p>Thank you for shopping with us!</p>
            `,
        });

        console.log(`✅ Order #${orderId} marked as delivered and user notified.`);
    }
}

