import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  attributes?: Record<string, any>;
}
