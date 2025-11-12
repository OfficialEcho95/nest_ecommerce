import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { RedisServer } from "redisServer";

@Injectable()
export class ShippingQueue {
    public shipmentQueue: Queue;
    constructor(private redisServer: RedisServer) {
        this.shipmentQueue = new Queue('shipment', {
            connection: this.redisServer.getConnection()
        });
    }

    async queueShipmentProcessing(orderId: number, shipmentId: number) {
        await this.shipmentQueue.add('process-shipment', { shipmentId });
    }

    async queueDeliveryConfirmation(orderId: number, shipmentId: number) {
        await this.shipmentQueue.add('confirm-delivery', { shipmentId });
    }
}