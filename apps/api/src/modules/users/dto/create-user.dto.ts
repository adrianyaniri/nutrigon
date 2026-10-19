import { createZodDto } from 'nestjs-zod';
import { createUserSchema } from '@nutrigon/contracts';

export class CreateUserDto extends createZodDto(createUserSchema) {}
