import { createZodDto } from 'nestjs-zod';
import { createComboSchema, updateComboSchema } from '@nutrigon/contracts';

export class CreateComboDto extends createZodDto(createComboSchema) {}
export class UpdateComboDto extends createZodDto(updateComboSchema) {}
