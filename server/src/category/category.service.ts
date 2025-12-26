import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { CategoryQueryService } from './category-query.service'
import { CreateCategoryDto, CategoryDto, ReorderCategoriesDto, UpdateCategoryDto, CategoryUsageType, MigrateDeactivateCategoryDto } from '@common-types'
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoryService {
  constructor(
    private readonly queryService: CategoryQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async seedSystemCategories(userId: string): Promise<void> {
    const methodName = CategoryService.name + '.seedSystemCategories'
    
    this.logger.log(`Initializing system categories for new user: ${userId}`, methodName)

    const id1 = uuidv4()
    const id2 = uuidv4()
    const id3 = uuidv4()

    const systemCategories = [
      {
        id: id1,
        name: 'Uncategorized',
        usage_type: 'transaction' as CategoryUsageType,
        is_system: true,
        sort_order: 0,
      },
      {
        id: id2,
        name: 'Uncategorized',
        usage_type: 'asset' as CategoryUsageType,
        is_system: true,
        sort_order: 0,
      },
      {
        id: id3,
        name: 'Uncategorized',
        usage_type: 'liability' as CategoryUsageType,
        is_system: true,
        sort_order: 0,
      }
    ]

    try {
      await this.queryService.insertSystemCategories(systemCategories, userId)
      this.logger.log(`Successfully seeded 3 system categories for user ${userId}`, methodName)
    } catch (error) {
      this.logger.error(`Critical Failure: Could not seed system categories for user ${userId}`, methodName)
      // We throw a ConflictException or InternalServerError here because 
      // without these, the user's account is basically broken.
      throw new ConflictException('Failed to initialize user account categories.')
    }
  }
  
  async createCategory(dto: CreateCategoryDto, userId: string): Promise<CategoryDto> {
    const methodName = CategoryService.name + '.createCategory'
    this.logger.log(`Attempting to create ${dto.usage_type} category: "${dto.name}" for user ${userId}`, methodName)

    // 1. Logic Check: Prevent duplicate names for the same usage type
    const existing = await this.queryService.findByNameAndType(dto.name, dto.usage_type, userId)
    if (existing) {
      if (!existing.active && existing.id) {
        const updatedCategory = await this.queryService.reactivateCategory(existing.id, userId);
        if (!updatedCategory) {
          throw new InternalServerErrorException('Failed to reactivate existing category.');
        }
        return updatedCategory; // Returns the full object to the frontend
      }
      throw new ConflictException(`A category named "${dto.name}" already exists.`);
    }

    const id = uuidv4()
    const newCategory = await this.queryService.createCategory({ ...dto, id }, userId)
    
    this.logger.log(`Successfully created category ID: ${newCategory.id}`, methodName)
    return newCategory
  }

  async updateCategory(dto: UpdateCategoryDto, userId: string): Promise<CategoryDto> {
    const methodName = CategoryService.name + '.updateCategory'
    this.logger.log(`Attempting to update category ${dto.id} for user ${userId}`, methodName)

    // 1. Fetch current state for guard logic
    const category = await this.queryService.getCategoryById(dto.id, userId)
    if (!category) {
      this.logger.warn(`Update failed: Category ${dto.id} not found`, methodName)
      throw new NotFoundException('Category not found.')
    }

    // 2. Guard: System categories cannot be renamed
    if (category.is_system && dto.name && dto.name !== category.name) {
      this.logger.warn(`Forbidden rename attempt on system category ${dto.id}`, methodName)
      throw new ConflictException('System categories are required by the app and cannot be renamed.')
    }

    const updated = await this.queryService.updateCategory(dto, userId)
    this.logger.log(`Successfully updated category ${dto.id}`, methodName)
    return updated
  }

  async deactivateCategory(dto: MigrateDeactivateCategoryDto, userId: string): Promise<{ success: boolean }> {
    const { category_id, usage_type, migrate_target_category_id } = dto;
    const methodName = CategoryService.name + '.deactivateCategory';
    
    this.logger.log(`Attempting to deactivate ${usage_type} category: ${category_id}`, methodName);

    // 1. Fetch the category to check its status/name
    const category = await this.queryService.getCategoryById(category_id, userId);
    
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // 2. Guard: Cannot deactivate the "Uncategorized" safety net
    // We check name or a 'is_system' flag if you have one.
    if (category.name.toLowerCase() === 'uncategorized') {
      this.logger.warn(`User ${userId} attempted to deactivate the system fallback category.`, methodName);
      throw new ConflictException('The "Uncategorized" category is a system requirement and cannot be deactivated.');
    }

    // 3. Hand off to the Query Service to find the fallback and migrate
    await this.queryService.migrateAndDeactivate(category_id, usage_type, migrate_target_category_id, userId);
    
    this.logger.log(`Successfully migrated and deactivated category ${category_id} to ${migrate_target_category_id}`, methodName);
    return { success: true };
  }

  async reorderCategories(dto: ReorderCategoriesDto, userId: string): Promise<{ success: boolean }> {
    const methodName = CategoryService.name + '.reorderCategories'
    this.logger.log(`Updating sort order for ${dto.categoryIds.length} categories for user ${userId}`, methodName)

    await this.queryService.bulkUpdateOrder(dto.categoryIds, userId)
    
    this.logger.log(`Successfully reordered categories for user ${userId}`, methodName)
    return { success: true }
  }

  async getUserCategories(userId: string): Promise<CategoryDto[]> {
    return await this.queryService.getUserCategories(userId)
  }
}
