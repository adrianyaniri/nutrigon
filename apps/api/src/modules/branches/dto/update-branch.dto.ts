import { createZodDto } from 'nestjs-zod';
import { updateBranchSchema } from '@nutrigon/contracts';

export class UpdateBranchDto extends createZodDto(updateBranchSchema) {}
