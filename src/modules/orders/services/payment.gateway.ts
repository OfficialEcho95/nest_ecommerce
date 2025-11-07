import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { ProductVariant } from 'src/modules/products/entities/product-variant.entity';
import { User } from '../../users/entities/users.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentGateway {
    constructor(
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
        private http: HttpService,
        private config: ConfigService,
    ) { }

    // Initialize Paystack transaction for an existing order
    async initializePaystackTransaction(orderId: number, user: User) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['user', 'items'],
        });
        if (!order) throw new NotFoundException('Order not found');

        console.log("user id from order:", order.user.id, "\nuser id from req:", user.id);
        // ensure user owns order unless admin
        if (user.role !== 'admin' && order.user.id !== user.id) {
            throw new ForbiddenException('You cannot initialize payment for this order');
        }

        if (order.status === 'PAID') {
            throw new BadRequestException('Order already paid');
        }

        // amount in kobo (NGN) => multiply by 100, order.totalPrice is number
        const amountInKobo = Math.round(Number(order.totalPrice) * 100);

        const payload = {
            email: order.user.email,
            amount: amountInKobo,
            currency: this.config.get('PAYSTACK_CURRENCY') || 'NGN',
            reference: `order_${order.id}_${Date.now()}`,
            metadata: {
                orderId: order.id,
            },
            // callback_url: this.config.get('PAYSTACK_CALLBACK_URL') || '', to be implemented with the frontend
        };

        console.log({
            email: order.user.email,
            amount: Math.round(Number(order.totalPrice) * 100),
            currency: 'NGN',
            reference: `order_${order.id}_${Date.now()}`,
        });

        const secret = this.config.get('PAYSTACK_SECRET_KEY');
        if (!secret) {
            throw new Error('PAYSTACK_SECRET_KEY is not set in config');
        }

        const url = 'https://api.paystack.co/transaction/initialize';
        const headers = {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        };

        const resp$ = this.http.post(url, payload, { headers });
        const resp = await firstValueFrom(resp$);

        if (!resp?.data || !resp.data.status) {
            throw new BadRequestException('Failed to initialize Paystack transaction');
        }

        // Save reference to order for later verification in webhook
        const reference = resp.data.data.reference;
        order.paystackReference = reference;
        await this.orderRepo.save(order);

        // return authorization_url and reference to frontend
        return {
            authorization_url: resp.data.data.authorization_url,
            reference,
        };
    }

    // helper to mark order as paid — used by webhook after verification
    async markOrderPaid(order: Order, paystackData: any) {
        order.status = 'PAID';
        order.paymentStatus = paystackData.status || 'success';
        await this.orderRepo.save(order);
    }
}