import {
    Column, PrimaryGeneratedColumn, UpdateDateColumn,
    CreateDateColumn, BeforeInsert, Entity,
    OneToMany
} from "typeorm";
import *  as bcrypt from 'bcrypt'
import { Order } from "src/modules/orders/entities/order.entity";


export enum UserRole {
    CUSTOMER = 'customer',
    ADMIN = 'admin'
}

@Entity('Users')
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstname: string

    @Column()
    lastname: string

    @Column({ unique: true })
    email: string

    @Column({ unique: true })
    phone: string

    @Column()
    password: string

    @Column({ nullable: true })
    address: string

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    })
    role: UserRole

    @Column({ default: false })
    isVerified: boolean

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => User, user => user.orders)
    orders: Order[];

    // Hash password before saving
    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

}