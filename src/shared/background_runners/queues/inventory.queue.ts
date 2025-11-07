import { Queue } from 'bullmq';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class InventoryQueue {
  public inventoryQueue: Queue;

  constructor(private redisServer: RedisServer) {
    this.inventoryQueue = new Queue('inventory', {
      connection: this.redisServer.getConnection(),
    });
  }

  async queueNotifyWareHouse(email: string[], productName: string, stock: number) {
    await this.inventoryQueue.add('notify-warehouse', {email, productName, stock})
  }

  async queueRestockProduct(productId: number, quantity: number) {
    await this.inventoryQueue.add('restock-product', { productId, quantity });
  }
}
