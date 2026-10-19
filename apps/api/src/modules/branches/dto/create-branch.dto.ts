import { createZodDto } from 'nestjs-zod';
import { createBranchSchema } from '@nutrigon/contracts';

export class CreateBranchDto extends createZodDto(createBranchSchema) {}
