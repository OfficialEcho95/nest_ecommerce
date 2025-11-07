import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity('ProductImages')
export class ProductImage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, p => p.images, { onDelete: 'CASCADE' })
    product: Product;

    @Column()
    url: string; // saved URL or local path

    @Column({ default: false })
    isPrimary: boolean;

}