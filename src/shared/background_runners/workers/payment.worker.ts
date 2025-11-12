// import { Injectable, Logger } from '@nestjs/common';
// import { Worker } from 'bullmq';
// import { RedisServer } from 'redisServer';
// import { PaymentGateway } from '../../../modules/orders/services/payment.gateway';
// import { User } from 'src/modules/users/entities/users.entity';
// import { PaystackWebhookController } from '../../../modules/orders/controllers/paystack-webhook.controller';

// @Injectable()
// export class PaymentWorker {
//   private readonly logger = new Logger(PaymentWorker.name);
//   private worker: Worker;

//   constructor(
//     private readonly paystackWebhookController: PaystackWebhookController,
//     private user: User,
//     private redisServer: RedisServer,
//     private paymentService: PaymentGateway, // inject service to handle real logic
//   ) {
//     this.worker = new Worker(
//       'payment',
//       async (job) => this.handleJob(job.name, job.data),
//       { connection: this.redisServer.getConnection() },
//     );

//     this.registerListeners();
//   }

//   private async handleJob(name: string, data: any) {
//     switch (name) {
//       case 'process-payment':
//         return this.processPayment(data);

//       case 'verify-transaction':
//         return this.verifyTransaction(data);

//       case 'refund':
//         return this.refund(data);

//       default:
//         this.logger.warn(`⚠️ Unknown job type: ${name}`);
//     }
//   }

//   private registerListeners() {
//     this.worker.on('completed', (job) => {
//       this.logger.log(`✅ Job "${job.name}" completed for ${JSON.stringify(job.data)}`);
//     });

//     this.worker.on('failed', (job, err) => {
//       this.logger.error(`❌ Job "${job?.name}" failed: ${err?.message}`, err?.stack);
//     });
//   }

//   /** 
//    * 🧾 Job: Process Payment
//    * Called when an order is created and payment needs to be initialized.
//    */
//   private async processPayment({ orderId, amount }: { orderId: number; amount: number }) {
//     this.logger.log(`💳 Processing payment for order ${orderId}, amount ₦${amount}`);

//     // Example: integrate with Paystack or any gateway
//     const result = await this.paymentService.initializePaystackTransaction(orderId, this.user);
//     this.logger.log(`Payment initialized: ${JSON.stringify(result)}`);

//     return result;
//   }

//   /** 
//    * ✅ Job: Verify Transaction
//    * Called by webhook or scheduler to confirm transaction success.
//    */
//   // private async verifyTransaction({ transactionRef }: { transactionRef: string }) {
//   //   this.logger.log(`🔍 Verifying transaction ref ${transactionRef}`);

//   //   const verification = await this.paystackWebhookController;

//   //   if (verification.status === 'success') {
//   //     this.logger.log(`✅ Transaction ${transactionRef} verified successfully`);
//   //   } else {
//   //     this.logger.warn(`⚠️ Transaction ${transactionRef} failed verification`);
//   //   }

//   //   return verification;
//   // }

//   /** 
//    * 💰 Job: Refund
//    * Called when refunding an order.
//    */
//   // private async refund({ orderId, reason }: { orderId: number; reason: string }) {
//   //   this.logger.log(`💸 Initiating refund for order ${orderId} — Reason: ${reason}`);

//   //   const refundResult = await this.paymentService.refundPayment(orderId, reason);
//   //   this.logger.log(`Refund completed: ${JSON.stringify(refundResult)}`);

//   //   return refundResult;
//   // }
// }
