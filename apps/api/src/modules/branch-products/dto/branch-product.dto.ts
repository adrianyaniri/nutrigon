import { createZodDto } from 'nestjs-zod';
import {
  upsertBranchProductSchema,
  branchProductQuerySchema,
} from '@nutrigon/contracts';

export class UpsertBranchProductDto extends createZodDto(upsertBranchProductSchema) {}
export class BranchProductQueryDto extends createZodDto(branchProductQuerySchema) {}
