import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../users/entities/users.entity";
import { BackgroundRunnersModule } from "src/shared/background_runners/modules/runners.module";
import { ShipmentService } from "../service/shipment.service";
import { ShipmentController } from "../controller/shipment.controller";
import { Shipment } from "../entity/shipment.entity";
import { Order } from "../../orders/entities/order.entity";
import { ProductVariant } from "src/modules/products/entities/product-variant.entity";
import { ShippingQueue } from "src/shared/background_runners/queues/shipment.queue";
import { RedisServer } from "redisServer";

@Module({
    imports: [TypeOrmModule.forFeature([Shipment,
        Order,
        ProductVariant,
        User,]),
        HttpModule,

        BackgroundRunnersModule
    ],
    controllers: [ShipmentController],
    providers: [ShipmentService, ShippingQueue, RedisServer
    ],
    exports: [ShipmentService],
})
export class ShipmentModule { }