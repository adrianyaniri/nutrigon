import { createZodDto } from 'nestjs-zod';
import {
  upsertBranchProductSchema,
  updateBranchProductOfferSchema,
  branchProductQuerySchema,
} from '@nutrigon/contracts';

export class UpsertBranchProductDto extends createZodDto(upsertBranchProductSchema) {}
export class UpdateBranchProductOfferDto extends createZodDto(
  updateBranchProductOfferSchema,
) {}
export class BranchProductQueryDto extends createZodDto(branchProductQuerySchema) {}
