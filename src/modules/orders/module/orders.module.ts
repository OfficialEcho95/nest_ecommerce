import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { OrdersController } from "../controllers/orders.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order, OrderItem } from "../entities/order.entity";
import { OrdersService } from "../services/orders.services";
import { PaymentGateway } from "../services/payment.gateway";
import { User } from "src/modules/users/entities/users.entity";
import { ProductVariant } from "src/modules/products/entities/product-variant.entity";
import { PaystackWebhookController } from "../controllers/paystack-webhook.controller";
import { BackgroundRunnersModule } from "src/shared/background_runners/modules/runners.module";


@Module({
    imports: [TypeOrmModule.forFeature([Order, Order,
        OrderItem,
        User,
        ProductVariant,]),
        HttpModule,
        BackgroundRunnersModule
    ],
    controllers: [OrdersController, PaystackWebhookController],
    providers: [OrdersService, PaymentGateway,
        ],
    exports: [OrdersService],
})
export class OrdersModule { }