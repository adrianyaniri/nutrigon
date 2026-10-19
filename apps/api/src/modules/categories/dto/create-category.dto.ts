import { createZodDto } from 'nestjs-zod';
import { createCategorySchema } from '@nutrigon/contracts';

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
