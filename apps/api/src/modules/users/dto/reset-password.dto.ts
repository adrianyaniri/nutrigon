import { createZodDto } from 'nestjs-zod';
import { resetPasswordSchema } from '@nutrigon/contracts';

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
