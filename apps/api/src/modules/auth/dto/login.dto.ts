import { createZodDto } from 'nestjs-zod';
import { loginSchema } from '@nutrigon/contracts';

export class LoginDto extends createZodDto(loginSchema) {}
