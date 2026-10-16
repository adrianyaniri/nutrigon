import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BranchesController } from './branches.controller.js';
import type { BranchesService } from './branches.service.js';
import type { BranchEntity } from '../../core/database/schema/branches.js';
import type { CreateBranchDto } from './dto/create-branch.dto.js';
import type { UpdateBranchDto } from './dto/update-branch.dto.js';

describe('BranchesController (TDD)', () => {
  let controller: BranchesController;
  let mockService: Partial<Record<keyof BranchesService, any>>;

  beforeEach(() => {
    mockService = {
      findAllActive: vi.fn(),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    controller = new BranchesController(mockService as BranchesService);
  });

  const mockBranch: BranchEntity = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Origone',
    slug: 'origone',
    address: 'Origone 123',
    phone: '1122334455',
    whatsappNumber: '5491122334455',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findAll', () => {
    it('should return all active branches for public catalog', async () => {
      mockService.findAllActive.mockResolvedValue([mockBranch]);

      const result = await controller.findAll();

      expect(mockService.findAllActive).toHaveBeenCalled();
      expect(result).toEqual([mockBranch]);
    });

    it('should return all branches including inactive when includeInactive is true', async () => {
      mockService.findAll = vi.fn().mockResolvedValue([mockBranch, { ...mockBranch, isActive: false }]);

      const result = await controller.findAll('true');

      expect(mockService.findAll).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });
  });

  describe('findBySlug', () => {
    it('should return branch by slug', async () => {
      mockService.findBySlug.mockResolvedValue(mockBranch);

      const result = await controller.findBySlug('origone');

      expect(mockService.findBySlug).toHaveBeenCalledWith('origone');
      expect(result).toEqual(mockBranch);
    });
  });

  describe('create', () => {
    it('should create new branch', async () => {
      const dto: CreateBranchDto = {
        name: 'Pedro Diaz',
        slug: 'pedro-diaz',
        address: 'Av. Pedro Diaz 456',
        whatsappNumber: '5491144332211',
      };
      mockService.create.mockResolvedValue({ ...mockBranch, ...dto });

      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('Pedro Diaz');
    });
  });

  describe('update', () => {
    it('should update branch by id', async () => {
      const dto: UpdateBranchDto = {
        whatsappNumber: '5491199887766',
      };
      mockService.update.mockResolvedValue({ ...mockBranch, ...dto });

      const result = await controller.update(mockBranch.id, dto);

      expect(mockService.update).toHaveBeenCalledWith(mockBranch.id, dto);
      expect(result.whatsappNumber).toBe('5491199887766');
    });
  });

  describe('softDelete', () => {
    it('should deactivate branch by id', async () => {
      mockService.softDelete.mockResolvedValue({ ...mockBranch, isActive: false });

      const result = await controller.softDelete(mockBranch.id);

      expect(mockService.softDelete).toHaveBeenCalledWith(mockBranch.id);
      expect(result.isActive).toBe(false);
    });
  });
});
