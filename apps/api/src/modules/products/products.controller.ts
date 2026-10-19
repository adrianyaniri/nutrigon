import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@nutrigon/contracts';
import { ProductsService } from './products.service.js';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto.js';
import { AuthRoles } from '../../common/decorators/auth-roles.decorator.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @AuthRoles(Role.ADMIN_GENERAL, Role.BRANCH_ADMIN)
  @Get()
  async findMany(@Query() query: ProductQueryDto) {
    return this.productsService.findMany(query);
  }

  @AuthRoles(Role.ADMIN_GENERAL, Role.BRANCH_ADMIN)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @AuthRoles(Role.ADMIN_GENERAL)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @AuthRoles(Role.ADMIN_GENERAL)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @AuthRoles(Role.ADMIN_GENERAL)
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
