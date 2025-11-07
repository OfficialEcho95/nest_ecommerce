import { Module } from "@nestjs/common";
import { ProductsController } from "./controllers/product.controllers";
import { ProductsService } from "./services/products.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { ProductImage } from "./entities/product-image.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { Category } from "./categories/category.entity";
import { Review } from "./entities/review.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage, ProductVariant, Review, Category ])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
