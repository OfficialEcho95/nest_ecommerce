import {
    Entity, Column, PrimaryGeneratedColumn,
    ManyToMany, JoinTable, OneToMany, CreateDateColumn,
    UpdateDateColumn, Index, DeleteDateColumn
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { Category } from '../categories/category.entity';
import { Review } from './review.entity';


@Entity('Products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    brand: string;

    @Column()
    stock: number;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    price: number;

    @Column({ default: true })
    isPublished: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn() // for soft delete
    deletedAt?: Date;

    @OneToMany(() => ProductVariant, variant => variant.product, { cascade: true })
    variants: ProductVariant[];

    @OneToMany(() => ProductImage, image => image.product, { cascade: true })
    images: ProductImage[];

    @ManyToMany(() => Category, c => c.products, { cascade: true })
    @JoinTable()
    categories: Category[];

    @OneToMany(() => Review, r => r.product) 
    reviews: Review[];
}   