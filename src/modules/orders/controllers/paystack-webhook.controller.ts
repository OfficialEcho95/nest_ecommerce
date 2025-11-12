import { Controller, Post, Req, Res, HttpCode, Logger, BadRequestException } from '@nestjs/common';
import express from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../../orders/services/orders.services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PaymentGateway } from '../services/payment.gateway';
import { Public } from 'src/shared/decorators/public.decorators';
import { InvoiceQueue } from 'src/shared/background_runners/queues/invoice.queue';
import { OrderQueue } from 'src/shared/background_runners/queues/order.queue';
import { ShipmentService } from 'src/modules/shipment/service/shipment.service';


@Controller('webhooks/paystack')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(
    private shipmentService: ShipmentService,
    private orderQueue: OrderQueue,
    private invoiceQueue: InvoiceQueue,
    private readonly ordersService: OrdersService,
    private paymentGateway: PaymentGateway,
    private config: ConfigService,
    private http: HttpService,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) { }

  @Public()
  @Post()
  @HttpCode(200)
  async handle(@Req() req: express.Request, @Res() res: express.Response) {
    const rawBody = (req as any).rawBody;
    const signature = req.header('x-paystack-signature');

    const secret = this.config.get('PAYSTACK_SECRET_KEY');
    if (!secret) {
      this.logger.error('Paystack secret not configured');
      throw new BadRequestException('Paystack not configured');
    }

    // compute signature
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(rawBody || '');
    const computedSignature = hmac.digest('hex');

    console.log('rawBody length:', rawBody?.length);
    console.log('typeof rawBody:', typeof rawBody);
    console.log('rawBody string:', rawBody?.toString());


    console.log('secret:', secret);
    console.log('computed:', computedSignature);
    console.log('received:', signature);
    console.log('rawBody:', rawBody.toString());


    if (computedSignature !== signature) {
      this.logger.warn('Invalid Paystack signature');
      // respond 400 or 401 — Paystack expects 200 quickly but for dev show 400
      return res.status(400).send({ status: false, message: 'Invalid signature' });
    }

    const event = req.body; // parsed JSON body
    this.logger.debug(`Paystack webhook received event: ${event.event}`);

    // verify the transaction reference via Paystack verify endpoint for extra safety
    try {
      const data = event.data || {};
      const reference = data.reference;

      if (!reference) {
        this.logger.warn('Paystack webhook event missing reference');
        return res.status(200).send({ received: true }); // ack
      }

      // find order by saved reference (paystackReference)
      const order = await this.orderRepo.findOne({
        where: { paystackReference: reference },
        relations: ['user', 'items'],
      });
      if (!order) {
        this.logger.warn(`Order not found for reference ${reference}`);
        return res.status(200).send({ received: true });
      }

      // Verify transaction with Paystack to be absolutely sure
      const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
      const verifyResp$ = this.http.get(verifyUrl, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const verifyResp = await firstValueFrom(verifyResp$);

      const verifyData = verifyResp?.data;
      if (!verifyData || !verifyData.data) {
        this.logger.warn('Paystack verify returned no data');
        return res.status(200).send({ received: true });
      }

      const status = verifyData.data.status; // should be 'success' if paid
      if (status === 'success') {
        const fullname = `${order.user.firstname} ${order.user.lastname}`;
        await this.paymentGateway.markOrderPaid(order, verifyData.data);
        await this.shipmentService.createShipment(order.id, 'Default Courier');
        await this.ordersService.updateStockAfterOrder(order.id);
        console.log("Queuing invoice generation and email...");
        await this.invoiceQueue.queueInvoiceGeneration(order.id, order.user.email);
        await this.invoiceQueue.queueInvoiceEmail(order.id, order.user.email, '' /* filePath has been set in the worker */);
        this.logger.log(`Order ${order.id} marked as PAID (ref ${reference})`);
      } else {
        this.logger.log(`Transaction ${reference} not successful: ${status}`);
      }
      order.status = 'PAID'
      order.paymentStatus = status;
      await this.orderRepo.save(order);
      // ack Paystack
      return res.status(200).send({ received: true });
    } catch (err) {
      this.logger.error('Error processing Paystack webhook', err);
      return res.status(500).send({ status: false });
    }
  }
}
