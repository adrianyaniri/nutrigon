import { createZodDto } from 'nestjs-zod';
import { createProductSchema, updateProductSchema, productQuerySchema } from '@nutrigon/contracts';

export class CreateProductDto extends createZodDto(createProductSchema) {}
export class UpdateProductDto extends createZodDto(updateProductSchema) {}
export class ProductQueryDto extends createZodDto(productQuerySchema) {}
