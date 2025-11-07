import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe,
  UploadedFiles, UseInterceptors
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { Roles } from '../../../shared/decorators/roles.decorators';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';


const productImageStorage = diskStorage({
  destination: './uploads/products',
  filename: (req, file, cb) => {
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')    // avoid windows filename errors
      .replace(/\..+/, '');  // remove milliseconds & Z

    const uniqueName = `${timestamp}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

// public read endpoints
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  findAll(@Query() q: ProductQueryDto) {
    return this.productsService.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // Admin-only
  @Post('add-product')
  @Roles('admin')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post(':id/images')
  @UseInterceptors(AnyFilesInterceptor({ storage: productImageStorage, }),)
  async uploadProductImages(@Param('id') id: number, @UploadedFiles() files: Express.Multer.File[],) {
    if (!files?.length) return { message: 'No files uploaded' };

    // Build file paths to store in DB
    const imagePaths = files.map(f => `uploads/products/${f.filename}`);
    await this.productsService.updateImages(id, imagePaths);
    return { message: 'Images uploaded', files: imagePaths };
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/variants')
  @Roles('admin')
  async updateVariants(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.updateVariants(id, dto.variants ?? []);
  }

  @Patch(':id/images')
  @Roles('admin')
  async updateImages(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.updateImages(id, dto.imageUrls ?? []);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    // This will perform permanent delete. Could also implement soft delete endpoint.
    return this.productsService.remove(id);
  }

  // Publish/unpublish
  @Patch(':id/publish')
  @Roles('admin')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.publish(id);
  }

  @Patch(':id/unpublish')
  @Roles('admin')
  unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.unpublish(id);
  }

  // yet to be implemented
  // Example images upload (stub) - use FileInterceptor or FilesInterceptor and configure storage
  // @Post(':id/images')
  // @Roles('admin')
  // @UseInterceptors(FilesInterceptor('images', 10))
  // uploadImages(@Param('id', ParseIntPipe) id: number, @UploadedFiles() files: Express.Multer.File[]) { ... }
}
