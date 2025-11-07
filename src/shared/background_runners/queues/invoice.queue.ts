import { Queue } from 'bullmq';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class InvoiceQueue {
  public invoiceQueue: Queue;

  constructor(private redisServer: RedisServer) {
    this.invoiceQueue = new Queue('invoice', {
      connection: this.redisServer.getConnection(),
    });
  }

  async queueInvoiceGeneration(orderId: number, userEmail: string) {
    await this.invoiceQueue.add('generate-invoice', { orderId, userEmail });
  }

  async queueInvoiceEmail(orderId: number, userEmail: string, filePath: string) {
    await this.invoiceQueue.add('email-invoice', { orderId, userEmail, filePath });
  }
}
