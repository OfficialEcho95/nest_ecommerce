import { Entity, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn,  } from "typeorm";
import { Order } from "../../orders/entities/order.entity";


export enum ShipmentStatus {
    PENDING = "PENDING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}

@Entity('Shipment')
export class Shipment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.shipment, { onDelete: 'CASCADE' })
    order: Order;

    @Column({default: ShipmentStatus.PENDING})
    status: ShipmentStatus;

    @Column()
    trackingNumber: string;

    @Column()
    courier: string;

    @Column({ type: 'json'})
    address: Record<string, any>;

    @Column()
    deliveredAt: Date;

    @Column()
    shippedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}