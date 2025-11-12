import { InvoiceQueue } from "src/shared/background_runners/queues/invoice.queue";
import { QueueAuthentication } from "src/shared/background_runners/queues/authentication.queue";
import { InventoryQueue } from "src/shared/background_runners/queues/inventory.queue";
import { OrderQueue } from "src/shared/background_runners/queues/order.queue";
import { PaymentQueue } from "src/shared/background_runners/queues/payment.queue";
import { RedisServer } from "redisServer";
import { Module } from "@nestjs/common";
import { RedisModule } from "redis.module";
import { ShipmentService } from "src/modules/shipment/service/shipment.service";

@Module({
    imports: [RedisModule],
    providers: [InvoiceQueue, QueueAuthentication, InventoryQueue, OrderQueue, PaymentQueue],
    exports: [InvoiceQueue, QueueAuthentication, InventoryQueue, OrderQueue, PaymentQueue],
})
export class BackgroundRunnersModule { }