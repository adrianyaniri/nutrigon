import { createZodDto } from 'nestjs-zod';
import { updateCategorySchema } from '@nutrigon/contracts';

export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
