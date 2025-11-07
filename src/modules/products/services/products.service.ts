import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { Category } from '../categories/category.entity';
import { ProductImage } from '../entities/product-image.entity';
import { CreateVariantDto } from '../dto/create-variant.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
        @InjectRepository(Category) private categoryRepo: Repository<Category>,
        @InjectRepository(ProductImage) private imageRepo: Repository<ProductImage>,
    ) { }


    async create(dto: CreateProductDto) {
        const product = this.productRepo.create({
            name: dto.name,
            description: dto.description,
            brand: dto.brand,
            price: dto.price ?? undefined,
            stock: dto.stock ?? undefined,
            isPublished: dto.isPublished ?? true,
        });

        if (dto.categoryIds?.length) {
            const cats = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
            product.categories = cats;
        }

        if (dto.variants?.length) {
            product.variants = dto.variants.map(v => this.variantRepo.create(v));
        }

        return this.productRepo.save(product);
    }

    async findAll(q: ProductQueryDto) {
        const page = q.page ?? 1;
        const limit = Math.min(q.limit ?? 20, 100);

        const qb = this.productRepo.createQueryBuilder('product')
            .leftJoinAndSelect('product.images', 'images')
            .leftJoinAndSelect('product.variants', 'variants')
            .leftJoinAndSelect('product.categories', 'categories')
            .leftJoinAndSelect('product.reviews', 'reviews')
            .where('product.isPublished = :pub', { pub: true })
            .andWhere('product.isDeleted = :del', { del: false });

        if (q.q) {
            qb.andWhere('(product.name LIKE :q OR product.description LIKE :q)', { q: `%${q.q}%` });
        }

        if (q.categoryId) {
            qb.andWhere('categories.id = :catId', { catId: q.categoryId });
        }

        if (q.priceMin != null) {
            qb.andWhere('(product.price >= :min OR variants.price >= :min)', { min: q.priceMin });
        }

        if (q.priceMax != null) {
            qb.andWhere('(product.price <= :max OR variants.price <= :max)', { max: q.priceMax });
        }

        if (q.minRating != null) {
            qb.andWhere('COALESCE(AVG(reviews.rating), 0) >= :minRating', { minRating: q.minRating })
                .groupBy('product.id');
        }

        // sorting
        switch (q.sort) {
            case 'price_asc': qb.orderBy('COALESCE(variants.price, product.price)', 'ASC'); break;
            case 'price_desc': qb.orderBy('COALESCE(variants.price, product.price)', 'DESC'); break;
            case 'newest': qb.orderBy('product.createdAt', 'DESC'); break;
            default: qb.orderBy('product.createdAt', 'DESC'); break;
        }

        qb.skip((page - 1) * limit).take(limit);

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }

    async findOne(id: number) {
        const product = await this.productRepo.findOne({
            where: { id },
            relations: ['images', 'variants', 'categories', 'reviews'],
        });
        if (!product || product.isDeleted) throw new NotFoundException('Product not found');
        return product;
    }

    async update(id: number, dto: UpdateProductDto) {
        const product = await this.findOne(id)
        if (!product) throw new NotFoundException('Product not found');
        Object.assign(product, dto);
        if (dto.categoryIds) {
            product.categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
        }
        return this.productRepo.save(product);
    }

    async updateVariants(productId: number, variants: UpdateProductDto[]) {
        const product = await this.findOne(productId);
        if (!product) throw new NotFoundException('Product not found');

        const results: ProductVariant[] = [];

        for (const v of variants) {
            if (v.id) {
                // Updating existing variant
                const existing = await this.variantRepo.findOne({
                    where: { id: v.id, product: { id: product.id } }, // product relation
                });

                if (!existing) throw new NotFoundException(`Variant with id ${v.id} not found for this product`);

                // Update only provided fields
                if (v.price !== undefined) existing.price = v.price;
                if (v.stock !== undefined) existing.stock = v.stock;
                if (v.attributes !== undefined) existing.attributes = v.attributes;

                results.push(existing);
            } else {
                // Creating new variant
                const newVariant = this.variantRepo.create({
                    price: v.price,
                    stock: v.stock,
                    attributes: v.attributes ?? null,
                    product,
                });
                results.push(newVariant);
            }
        }
        await this.variantRepo.save(results);

        return this.findOne(product.id); // reload product with updated variants
    }

    async updateImages(id: number, imageUrls: string[]) {
        const product = await this.findOne(id);
        if (!product) throw new NotFoundException('Product not found');

        // remove existing images
        await this.imageRepo.delete({ product: { id } });

        //map is used there to turn one array into another array
        const newImages = imageUrls.map((url) => this.imageRepo.create({ url, product }));

        await this.imageRepo.save(newImages);
        return this.findOne(id);
    }

    async remove(id: number) {
        // permanent delete
        const product = await this.findOne(id);
        return this.productRepo.remove(product);
    }

    async publish(id: number) {
        const p = await this.findOne(id);
        p.isPublished = true;
        return this.productRepo.save(p);
    }

    async unpublish(id: number) {
        const p = await this.findOne(id);
        p.isPublished = false;
        return this.productRepo.save(p);
    }

    // example: decrement stock (atomic-ish) at variant level
    async decrementVariantStock(id: number, qty = 1) {
        const variant = await this.variantRepo.findOne({ where: { id } });
        if (!variant) throw new NotFoundException('Variant not found');
        if (variant.stock < qty) throw new BadRequestException('Out of stock');
        variant.stock -= qty;
        return this.variantRepo.save(variant);
    }
}