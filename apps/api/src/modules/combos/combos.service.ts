import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  SaleUnit,
  type BranchComboAdminItem,
  type BranchComboCatalogItem,
  type ComboItem,
} from '@nutrigon/contracts';
import {
  COMBOS_REPOSITORY,
  type ICombosRepository,
  type BranchComboRecord,
} from './combos.repository.interface.js';
import {
  BRANCHES_REPOSITORY,
  type IBranchesRepository,
} from '../branches/branches.repository.interface.js';
import {
  PRODUCTS_REPOSITORY,
  type IProductsRepository,
} from '../products/products.repository.interface.js';
import type { CreateComboDto, UpdateComboDto } from './dto/combo.dto.js';

@Injectable()
export class CombosService {
  constructor(
    @Inject(COMBOS_REPOSITORY)
    private readonly combosRepository: ICombosRepository,
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepository: IBranchesRepository,
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  private mapToAdminItem(record: BranchComboRecord): BranchComboAdminItem {
    return {
      id: record.id,
      branchId: record.branchId,
      name: record.name,
      description: record.description,
      imageUrls: record.imageUrls ?? [],
      price: Number(record.price),
      isAvailable: record.isAvailable,
      isActive: record.isActive,
      items: record.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity),
        saleUnit: item.saleUnit as SaleUnit,
      })),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private async validateComboItems(items: ComboItem[]): Promise<void> {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.productId)) {
        throw new BadRequestException(
          `Duplicate product "${item.productId}" is not allowed in the same combo`,
        );
      }
      seen.add(item.productId);

      const product = await this.productsRepository.findById(item.productId);
      if (!product || !product.isActive) {
        throw new BadRequestException(
          `Product "${item.productId}" does not exist or is inactive`,
        );
      }
    }
  }

  async listForBranch(branchId: string): Promise<BranchComboAdminItem[]> {
    const branch = await this.branchesRepository.findById(branchId);
    if (!branch) {
      throw new NotFoundException(`Branch with ID "${branchId}" was not found`);
    }

    const records = await this.combosRepository.findByBranch(branchId);
    return records.map((r) => this.mapToAdminItem(r));
  }

  async listPublicForBranch(slug: string): Promise<BranchComboCatalogItem[]> {
    const branch = await this.branchesRepository.findBySlug(slug);
    if (!branch || !branch.isActive) {
      throw new NotFoundException(`Branch "${slug}" was not found or is inactive`);
    }

    const records = await this.combosRepository.findPublishedByBranch(branch.id);
    return records.map((record) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      price: Number(record.price),
      priceUnitLabel: 'combo',
      imageUrls: record.imageUrls ?? [],
      items: record.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity),
        saleUnit: item.saleUnit as SaleUnit,
      })),
    }));
  }

  async createForBranch(
    branchId: string,
    dto: CreateComboDto,
  ): Promise<BranchComboAdminItem> {
    const branch = await this.branchesRepository.findById(branchId);
    if (!branch || !branch.isActive) {
      throw new NotFoundException(
        `Branch with ID "${branchId}" was not found or is inactive`,
      );
    }

    await this.validateComboItems(dto.items);

    const record = await this.combosRepository.create({
      branchId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      imageUrls: dto.imageUrls ?? [],
      price: dto.price.toFixed(2),
      isAvailable: dto.isAvailable ?? true,
      items: dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity.toFixed(3),
      })),
    });

    return this.mapToAdminItem(record);
  }

  async updateForBranch(
    branchId: string,
    comboId: string,
    dto: UpdateComboDto,
  ): Promise<BranchComboAdminItem> {
    const existing = await this.combosRepository.findByIdAndBranch(comboId, branchId);
    if (!existing) {
      throw new NotFoundException(
        `Combo "${comboId}" was not found in branch "${branchId}"`,
      );
    }

    if (dto.items) {
      await this.validateComboItems(dto.items);
    }

    const updated = await this.combosRepository.update(comboId, branchId, {
      name: dto.name?.trim(),
      description:
        dto.description !== undefined ? dto.description?.trim() || null : undefined,
      imageUrls: dto.imageUrls,
      price: dto.price !== undefined ? dto.price.toFixed(2) : undefined,
      isAvailable: dto.isAvailable,
      items: dto.items?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity.toFixed(3),
      })),
    });

    if (!updated) {
      throw new NotFoundException(
        `Combo "${comboId}" was not found in branch "${branchId}"`,
      );
    }

    return this.mapToAdminItem(updated);
  }

  async softDeleteForBranch(
    branchId: string,
    comboId: string,
  ): Promise<BranchComboAdminItem> {
    const existing = await this.combosRepository.findByIdAndBranch(comboId, branchId);
    if (!existing) {
      throw new NotFoundException(
        `Combo "${comboId}" was not found in branch "${branchId}"`,
      );
    }

    const deleted = await this.combosRepository.softDelete(comboId, branchId);
    if (!deleted) {
      throw new NotFoundException(
        `Combo "${comboId}" was not found in branch "${branchId}"`,
      );
    }

    return this.mapToAdminItem(deleted);
  }
}
