import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { BranchEntity } from '../../core/database/schema/branches.js';
import {
  BRANCHES_REPOSITORY,
  type IBranchesRepository,
} from './branches.repository.interface.js';
import type { CreateBranchDto } from './dto/create-branch.dto.js';
import type { UpdateBranchDto } from './dto/update-branch.dto.js';

@Injectable()
export class BranchesService {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepository: IBranchesRepository,
  ) {}

  async findAllActive(): Promise<BranchEntity[]> {
    return this.branchesRepository.findAllActive();
  }

  async findAll(): Promise<BranchEntity[]> {
    return this.branchesRepository.findAll();
  }

  async findById(id: string): Promise<BranchEntity> {
    const branch = await this.branchesRepository.findById(id);
    if (!branch) {
      throw new NotFoundException(`Branch with ID "${id}" was not found`);
    }
    return branch;
  }

  async findBySlug(slug: string): Promise<BranchEntity> {
    const branch = await this.branchesRepository.findBySlug(slug);
    if (!branch || !branch.isActive) {
      throw new NotFoundException(`Branch "${slug}" was not found or is inactive`);
    }
    return branch;
  }

  async create(dto: CreateBranchDto): Promise<BranchEntity> {
    const existing = await this.branchesRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`A branch with slug "${dto.slug}" already exists`);
    }

    return this.branchesRepository.create({
      name: dto.name,
      slug: dto.slug,
      address: dto.address ?? null,
      phone: dto.phone ?? null,
      whatsappNumber: dto.whatsappNumber ?? null,
      isActive: true,
    });
  }

  private async ensureUniqueBranchSlug(slug: string, excludeBranchId?: string): Promise<void> {
    const existingSlug = await this.branchesRepository.findBySlug(slug);
    if (existingSlug && existingSlug.id !== excludeBranchId) {
      throw new ConflictException(`A branch with slug "${slug}" already exists`);
    }
  }

  async update(id: string, dto: UpdateBranchDto): Promise<BranchEntity> {
    const branch = await this.findById(id);

    if (dto.slug && dto.slug.toLowerCase().trim() !== branch.slug.toLowerCase().trim()) {
      await this.ensureUniqueBranchSlug(dto.slug, id);
    }

    const updated = await this.branchesRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Branch with ID "${id}" was not found`);
    }

    return updated;
  }

  async softDelete(id: string): Promise<BranchEntity> {
    const branch = await this.branchesRepository.findById(id);
    if (!branch) {
      throw new NotFoundException(`Branch with ID "${id}" was not found`);
    }

    const updated = await this.branchesRepository.update(id, { isActive: false });
    return updated!;
  }
}
