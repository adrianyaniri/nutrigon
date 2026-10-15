import type { ProductEntity, NewProductEntity } from '../../core/database/schema/products.js';
import type { ProductQueryDto } from './dto/product.dto.js';

export const PRODUCTS_REPOSITORY = Symbol('PRODUCTS_REPOSITORY');

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProductsRepository {
  findMany(query: ProductQueryDto): Promise<PaginatedResult<ProductEntity>>;
  findById(id: string): Promise<ProductEntity | null>;
  findByCode(code: string): Promise<ProductEntity | null>;
  create(data: NewProductEntity): Promise<ProductEntity>;
  update(id: string, data: Partial<NewProductEntity>): Promise<ProductEntity | null>;
  softDelete(id: string): Promise<ProductEntity | null>;
}
