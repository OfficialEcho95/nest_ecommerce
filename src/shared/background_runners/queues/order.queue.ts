import { Queue } from 'bullmq';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class OrderQueue {
  public orderQueue: Queue;

  constructor(private redisServer: RedisServer) {
    this.orderQueue = new Queue('order', {
      connection: this.redisServer.getConnection(),
    });
  }
  async queueOrderCreation(orderId: number, fullname: string, email: string, fullvariant: string, totalPrice: number) {
    await this.orderQueue.add('create-order', { orderId, fullname, email, fullvariant, totalPrice });
  }

  async queueCancelledOrder(orderId: number, fullname: string, email: string, fullvariant: string,) {
    await this.orderQueue.add('cancel-order', {orderId, fullname, email, fullvariant})
  }
}