import { Order } from "src/modules/orders/entities/order.entity";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Shipment, ShipmentStatus } from "../entity/shipment.entity";
import { InventoryQueue } from 'src/shared/background_runners/queues/inventory.queue';
import { ProductVariant } from 'src/modules/products/entities/product-variant.entity';
import { User, UserRole } from "../../users/entities/users.entity";
import { ShippingQueue } from "src/shared/background_runners/queues/shipment.queue";

@Injectable()
export class ShipmentService {
    constructor(
        private shippingQueue: ShippingQueue,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
        private inventoryQueue: InventoryQueue,
        @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
        @InjectRepository(Order) private orderRepo: Repository<Order>
    ) { }

    async createShipment(orderId: number, courier: string) {
        const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['user', 'items'] });
        if (!order) throw new NotFoundException(`Order with id: ${orderId} does not exist`);
        if (!order.shippingAddress) throw new NotFoundException(`No shipping address found for order ${orderId}`);

        const trackingNumber = `TRK-${Date.now()}-${orderId}`;
        const address = order.shippingAddress;

        const shipment = this.shipmentRepo.create({
            order,
            courier,
            address,
            trackingNumber,
            status: ShipmentStatus.PENDING
        });
        await this.shipmentRepo.save(shipment);

        // Get all admins
        const admins = await this.userRepo.find({ where: { role: UserRole.ADMIN } });
        const adminEmails = admins.map(a => a.email);

        for (const item of order.items) {
            const variant = await this.variantRepo.findOne({
                where: { id: item.variantId },
                relations: ['product']
            });
            if (!variant) continue;

            await this.inventoryQueue.queueNotifyWareHouseShipment(
                adminEmails,
                variant.product.name,
                item.quantity,
                orderId,
                courier,
                trackingNumber,
            );

            await this.shippingQueue.queueShipmentProcessing(orderId, shipment.id);
        }
        return shipment;
    }


    async updateShipment(orderId: number, shipmentId: number) {
        const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['user'] });
        if (!order) {
            throw new NotFoundException(`Order with id: ${orderId} does not exist`)
        }
        const shipment = await this.shipmentRepo.findOne({ where: { id: shipmentId } });
        if (!shipment) {
            throw new NotFoundException("Shipment not found!!");
        }
        shipment.status = ShipmentStatus.DELIVERED;
        shipment.updatedAt = new Date();
    }


    findAll() {
        return this.shipmentRepo.find({ relations: ['order'] });
    }

    findOne(id: number) {
        return this.shipmentRepo.findOne({ where: { id }, relations: ['order'] });
    }

}