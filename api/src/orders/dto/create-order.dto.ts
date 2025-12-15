import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderSource {
  ONLINE = 'online',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
  WHOLESALE = 'wholesale',
}

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  RUSH = 'rush',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  REFUNDED = 'refunded',
}

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price as string' })
  @IsString()
  unitPrice: string;

  @ApiPropertyOptional({ description: 'Special instructions for this item' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Item customizations' })
  @IsOptional()
  @IsObject()
  customizations?: Record<string, any>;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Order number (unique identifier)' })
  @IsString()
  orderNumber: string;

  @ApiPropertyOptional({ description: 'Customer ID if existing customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ enum: OrderSource, description: 'Order source' })
  @IsEnum(OrderSource)
  source: OrderSource;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Order status',
    default: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: OrderPriority,
    description: 'Order priority',
    default: OrderPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Payment status',
    default: PaymentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ description: 'Subtotal amount' })
  @IsString()
  subtotal: string;

  @ApiProperty({ description: 'Tax amount' })
  @IsString()
  tax: string;

  @ApiPropertyOptional({ description: 'Discount amount', default: '0' })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty({ description: 'Total amount' })
  @IsString()
  total: string;

  @ApiPropertyOptional({ description: 'Pickup time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  pickupTime?: string;

  @ApiPropertyOptional({ description: 'Delivery time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  deliveryTime?: string;

  @ApiPropertyOptional({ description: 'Special requests from customer' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
