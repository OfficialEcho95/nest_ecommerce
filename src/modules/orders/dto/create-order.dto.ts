import {
  IsArray, ValidateNested, IsEnum, IsOptional,
  IsString, IsNotEmpty, IsNumber, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  @Min(1)
  variantId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

class ShippingAddressDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() state: string;
  @IsString() @IsNotEmpty() country: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsEnum(['card', 'paypal', 'cod'])
  paymentMethod: 'card' | 'paypal' | 'cod';

  @IsOptional()
  @IsString()
  note?: string;
}
