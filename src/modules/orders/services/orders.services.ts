import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Order } from "../entities/order.entity";
import { CreateOrderDto } from "../dto/create-order.dto";
import { User, UserRole } from "../../users/entities/users.entity";
import { ProductVariant } from "src/modules/products/entities/product-variant.entity";
import { PaymentGateway } from "./payment.gateway";
import { OrderQueue } from "src/shared/background_runners/queues/order.queue";
import { InventoryQueue } from "src/shared/background_runners/queues/inventory.queue";

@Injectable()
export class OrdersService {
    constructor(
        private inventoryQueue: InventoryQueue,
        private orderQueue: OrderQueue,
        private readonly datasource: DataSource,
        private paymentGateway: PaymentGateway,
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    ) { }

    async create(dto: CreateOrderDto, userId: number) {
        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new NotFoundException('User not found');

        let totalPrice = 0;
        const items: { variantId: number; quantity: number }[] = [];
        const variantDescriptions: string[] = [];

        for (const item of dto.items) {
            const variant = await this.variantRepo.findOne({
                where: { id: item.variantId },
                relations: ['product'], // optional if you want product name
            });

            if (!variant)
                throw new NotFoundException(`Variant ${item.variantId} not found`);

            if (variant.stock < item.quantity)
                throw new BadRequestException(
                    `Insufficient stock for variant ${item.variantId}`,
                );

            totalPrice += (variant.price || 0) * item.quantity;

            items.push({ variantId: variant.id, quantity: item.quantity });

            // Format readable variant details
            let attrs = '';

            if (Array.isArray(variant.attributes)) {
                attrs = variant.attributes
                    .map(attr => `${attr.name}: ${attr.value}`)
                    .join(', ');
            } else if (variant.attributes && typeof variant.attributes === 'object') {
                attrs = Object.entries(variant.attributes)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
            }

            variantDescriptions.push(
                `${variant.product?.name ?? 'Product'} (${attrs}) — ₦${variant.price} x ${item.quantity}`
            );
        }

        const order = this.orderRepo.create({
            user,
            shippingAddress: dto.shippingAddress,
            paymentMethod: dto.paymentMethod,
            note: dto.note,
            items,
            totalPrice,
        });

        await this.orderRepo.save(order);

        const fullname = `${user.firstname} ${user.lastname}`;
        const fullvariant = variantDescriptions.join('; ');

        await this.orderQueue.queueOrderCreation(order.id, fullname, user.email, fullvariant, order.totalPrice);

        return order;
    }


    async updateOrderStatus(orderId: number, status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') {
        const order = await this.orderRepo.findOneBy({ id: orderId });
        let paystackData: any = null;
        if (!order) throw new NotFoundException('Order not found');
        // to be completed: add validation for status transitions
        await this.paymentGateway.markOrderPaid(order, paystackData);
        order.status = status;
        await this.orderRepo.save(order);
    }

    async getUserOrders(userId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        return this.orderRepo.find({
            where: { user: { id: userId } },
            relations: ['items'],
            order: { createdAt: 'DESC' },
        });
    }


    async getOrderById(orderId: number, userId: number) {
        const order = await this.orderRepo.findOne({
            where: {
                id: orderId,
                user: { id: userId }
            },
            relations: ['items']
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }


    async adminGetOrderById(orderId: number) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'user'],
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    // alternate method to update stock after order is successful
    // async updateStockAfterOrder(orderId: number) {
    //     const order = await this.orderRepo.findOne({
    //         where: { id: orderId },
    //         relations: ['items']
    //     });
    //     if (!order) throw new NotFoundException('Order not found');

    //     for (const item of order.items) {
    //         const variant = await this.variantRepo.findOneBy({ id: item.variantId });
    //         if (!variant) throw new NotFoundException(`Variant ${item.variantId} not found`);

    //         variant.stock -= item.quantity;
    //         await this.variantRepo.save(variant);
    //     }
    // }



    //using transactions(all or nothing behavior) to update db to ensure data integrity(recommended)
    // atomicity. all succeeds or all fails
    async updateStockAfterOrder(orderId: number) {
        const queryRunner = this.datasource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction();
        try {

            const order = await queryRunner.manager.findOne(this.orderRepo.target, {
                where: { id: orderId },
                relations: ['items']
            });

            if (!order) throw new NotFoundException('Order not found');

            for (const item of order.items) {
                const variant = await queryRunner.manager.findOne(this.variantRepo.target, {
                    where: { id: item.variantId },
                    relations: ['product']
                });
                if (!variant) throw new NotFoundException(`Variant ${item.variantId} not found`);

                variant.stock -= item.quantity;

                const productName = variant.product.name;

                const admins = await queryRunner.manager.find(this.userRepo.target, {
                    where: { role: UserRole.ADMIN }
                })
                const emails = admins.map(a => a.email);

                await queryRunner.manager.save(this.variantRepo.target, variant);
                if (variant.stock > 0 && variant.stock < 20) {
                    await this.inventoryQueue.queueNotifyWareHouse(emails, productName, variant.stock)
                }
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    // admin method to get all orders
    async adminGetAllOrders(page = 1, limit = 20) {
        const [orders, total] = await this.orderRepo.findAndCount({
            relations: ['items', 'user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { orders, total, page, limit }
    }

    // function to cancel order
    async cancelOrder(orderId: number, userId: number) {
        const variantDescriptions: string[] = [];
        const queryRunner = this.datasource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const order = await queryRunner.manager.findOne(this.orderRepo.target, {
                where: {
                    id: orderId,
                    user: { id: userId },
                },
                relations: ['items', 'user'], // ✅ include user relation
            });

            if (!order) throw new NotFoundException('Order not found');
            if (order.status === 'CANCELLED') {
                throw new BadRequestException('Order already cancelled');
            }

            const shouldRestock = order.status === 'PAID' && order.paymentStatus === 'success';

            if (shouldRestock) {
                for (const item of order.items) {
                    const variant = await queryRunner.manager.findOne(this.variantRepo.target, {
                        where: { id: item.variantId },
                        relations: ['product'], // ✅ ensure product is loaded for name
                    });

                    if (!variant) throw new NotFoundException(`Variant ${item.variantId} not found`);

                    variant.stock += item.quantity;
                    await queryRunner.manager.save(this.variantRepo.target, variant);

                    const attrs = (variant.attributes ?? [])
                        .map(attr => `${attr.name}: ${attr.value}`)
                        .join(', ');

                    variantDescriptions.push(
                        `${variant.product?.name ?? 'Product'} (${attrs}) — ₦${variant.price} x ${item.quantity}`
                    );
                }
            }

            order.status = 'CANCELLED';
            await queryRunner.manager.save(this.orderRepo.target, order);

            await queryRunner.commitTransaction();

            // 🧠 queue email notification AFTER commit (safest)
            const fullname = `${order.user.lastname} ${order.user.firstname}`;
            const email = order.user.email;

            const fullvariant = variantDescriptions.join('; ');

            await this.orderQueue.queueCancelledOrder(order.id, fullname, fullvariant, email);

            return order;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }


    // function to get completed orders 
    async getAllCompletedOrders() {
        const order = await this.orderRepo.find({
            where: { status: 'PAID', paymentStatus: 'success' },
            relations: ['items', 'user'],
        });
        if (!order) throw new NotFoundException('No completed orders found');
        return order;
    }
}