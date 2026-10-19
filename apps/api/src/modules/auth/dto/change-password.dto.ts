import { createZodDto } from 'nestjs-zod';
import { changePasswordSchema } from '@nutrigon/contracts';

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
