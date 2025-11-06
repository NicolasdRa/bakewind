import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Inventory category and unit enum values
export const inventoryCategoryValues = ['ingredient', 'packaging', 'supplies'] as const;
export const inventoryUnitValues = ['kg', 'g', 'l', 'ml', 'unit', 'dozen'] as const;

// Create inventory item schema
export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(inventoryCategoryValues),
  unit: z.enum(inventoryUnitValues),
  currentStock: z.number().min(0),
  minimumStock: z.number().min(0),
  reorderPoint: z.number().min(0),
  reorderQuantity: z.number().min(0),
  costPerUnit: z.number().min(0),
  supplier: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  notes: z.string().optional(),
});

// Update inventory item schema (all fields optional)
export const updateInventoryItemSchema = createInventoryItemSchema.partial();

// DTOs
export class CreateInventoryItemDto extends createZodDto(createInventoryItemSchema) {}
export class UpdateInventoryItemDto extends createZodDto(updateInventoryItemSchema) {}

// Response DTO
export interface InventoryItemDto {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  costPerUnit: number;
  supplier: string | null;
  location: string | null;
  notes: string | null;
  expirationDate: string | null;
  lastRestocked: string | null;
  createdAt: string;
  updatedAt: string;
}
