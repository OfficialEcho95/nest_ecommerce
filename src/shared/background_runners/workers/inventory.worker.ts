import { RedisServer } from 'redisServer';
import { Worker } from 'bullmq';
import { transporter } from 'nodemailer.setup';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryWorker {
    public inventoryWorker: Worker;
    constructor(
        private redisServer: RedisServer
    ) {
        this.inventoryWorker = new Worker(
            'inventory',
            async job => {
                switch (job.name) {
                    case 'notify-warehouse':
                        return this.notifyWarehouse(job.data);
                }
            },
            { connection: this.redisServer.getConnection() }
        )
    }

    async notifyWarehouse({ email, productName, stock }: { email: string[], productName: string, stock: number }) {
        await transporter.sendMail({
            from: `"Nest E-Commerce" <${process.env.MAIL_USER}>`,
            to: email,
            text: `
            <h2>⚠️ Low Stock Alert</h2>
        <p><b>Product:</b> ${productName}</p>
        <p><b>Remaining stock:</b> ${stock}</p>
        <p>If not restocked, this product will be unpublished soon.</p>
            `,
            subject: ` The current quantity of ${productName} is ${stock}, if product is not restocked, it will be unpublished`,
            html: ``
        })
        console.log(`📦 Sent low stock alert for ${productName}`);
    }

    async notifyWarehouseShipment({
        email,
        productName,
        stock,
        orderId,
        courier,
        trackingNumber,
        message,
    }: {
        email: string[];
        productName: string;
        stock: number;
        orderId: number;
        courier: string;
        trackingNumber: string;
        message?: string;
    }) {
        const subject = `📦 New Shipment for Order #${orderId}`;
        const htmlContent = message || `
    <h2>📦 New Shipment Notification</h2>
    <p><b>Order ID:</b> ${orderId}</p>
    <p><b>Product:</b> ${productName}</p>
    <p><b>Quantity:</b> ${stock}</p>
    <p><b>Courier:</b> ${courier}</p>
    <p><b>Tracking Number:</b> ${trackingNumber}</p>
    <br/>
    <p>Please prepare the package for pickup or dispatch accordingly.</p>
  `;

        try {
            await transporter.sendMail({
                from: `"Nest E-Commerce" <${process.env.MAIL_USER}>`,
                to: email.join(','), // handles multiple recipients
                subject,
                html: htmlContent,
                text: htmlContent.replace(/<[^>]*>?/gm, ''), // plain text fallback
            });

            console.log(`🚚 Shipment notification sent for Order #${orderId}`);
        } catch (err) {
            console.error(`❌ Failed to send shipment notification for Order #${orderId}`, err);
        }
    }

}