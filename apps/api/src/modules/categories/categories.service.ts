import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { CategoryEntity } from '../../core/database/schema/categories.js';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from './categories.repository.interface.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';
import { slugify } from '../../common/utils/slug.util.js';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,
  ) {}

  async findAllActive(): Promise<CategoryEntity[]> {
    return this.categoriesRepository.findAllActive();
  }

  async findAll(): Promise<CategoryEntity[]> {
    return this.categoriesRepository.findAll();
  }

  async findById(id: string): Promise<CategoryEntity> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" was not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryEntity> {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category || !category.isActive) {
      throw new NotFoundException(`Category "${slug}" was not found or is inactive`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const existing = await this.categoriesRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`A category with slug "${slug}" already exists`);
    }

    return this.categoriesRepository.create({
      name: dto.name,
      slug,
      orderIndex: dto.orderIndex ?? 0,
      isActive: true,
    });
  }

  private async resolveUpdatedSlug(
    currentId: string,
    currentSlug: string,
    requestedSlug?: string,
  ): Promise<string> {
    if (!requestedSlug) {
      return currentSlug;
    }

    const normalizedSlug = slugify(requestedSlug);
    if (normalizedSlug === currentSlug) {
      return currentSlug;
    }

    const existingSlug = await this.categoriesRepository.findBySlug(normalizedSlug);
    if (existingSlug && existingSlug.id !== currentId) {
      throw new ConflictException(`A category with slug "${normalizedSlug}" already exists`);
    }

    return normalizedSlug;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.findById(id);
    const slugToUpdate = await this.resolveUpdatedSlug(id, category.slug, dto.slug);

    const updated = await this.categoriesRepository.update(id, {
      ...dto,
      slug: slugToUpdate,
    });

    if (!updated) {
      throw new NotFoundException(`Category with ID "${id}" was not found`);
    }

    return updated;
  }

  async softDelete(id: string): Promise<CategoryEntity> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" was not found`);
    }

    const updated = await this.categoriesRepository.update(id, { isActive: false });
    return updated!;
  }
}
