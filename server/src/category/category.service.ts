import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { CategoryQueryService } from './category-query.service'
import { CreateCategoryDto, CategoryDto, ReorderCategoriesDto, UpdateCategoryDto, CategoryUsageType } from '@common-types'
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
      this.logger.warn(`Category creation failed: Name "${dto.name}" already exists for type ${dto.usage_type}`, methodName)
      throw new ConflictException(`You already have a category named "${dto.name}" for ${dto.usage_type}s.`)
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

  async deactivateCategory(dto: { category_id: string, fallback_category_id: string }, userId: string): Promise<{ success: boolean }> {
    const methodName = CategoryService.name + '.deactivateCategory'
    this.logger.log(`Attempting to deactivate category ${dto.category_id}. Fallback: ${dto.fallback_category_id}`, methodName)

    // 1. Guard: Check if it's a system category
    const category = await this.queryService.getCategoryById(dto.category_id, userId)
    if (category?.is_system) {
      this.logger.warn(`Deactivation failed: Category ${dto.category_id} is a system requirement`, methodName)
      throw new ConflictException('This is a system category and cannot be deactivated.')
    }

    // 2. Logic Check: Ensure usage types match (can't move Asset items to a Transaction category)
    const fallback = await this.queryService.getCategoryById(dto.fallback_category_id, userId)
    if (category && category.usage_type !== fallback?.usage_type) {
      this.logger.warn(`Deactivation failed: Usage type mismatch between ${category.usage_type} and ${fallback?.usage_type}`, methodName)
      throw new ConflictException('The fallback category must be of the same type (e.g., Asset to Asset).')
    }

    await this.queryService.migrateAndDeactivate(dto.category_id, dto.fallback_category_id, userId)
    
    this.logger.log(`Successfully deactivated category ${dto.category_id} and migrated items to ${dto.fallback_category_id}`, methodName)
    return { success: true }
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
