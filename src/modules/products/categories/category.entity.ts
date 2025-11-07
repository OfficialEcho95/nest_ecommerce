import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Product } from '../entities/product.entity';

@Entity('Categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;


  @Column({ nullable: true })
  parentId?: number; // for hierarchical categories

  @ManyToMany(() => Product, (p) => p.categories)
  products: Product[];
}
