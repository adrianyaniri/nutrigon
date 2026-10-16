import { createZodDto } from 'nestjs-zod';
import { getUploadUrlSchema } from '@nutrigon/contracts';

export class GetUploadUrlDto extends createZodDto(getUploadUrlSchema) {}
