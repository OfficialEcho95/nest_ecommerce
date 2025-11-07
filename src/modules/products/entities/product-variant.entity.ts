import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Product } from './product.entity';


@Entity('ProductVariants')
export class ProductVariant {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, p => p.variants,  { onDelete: 'CASCADE' })
    product: Product;

    @Column({type: 'json', nullable: true})
    attributes: Record<string, any> | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price: number;

    @Column({type: 'int', default: 0 })
    stock: number;

    @Column({ default: true })
    isActive: boolean;
}

