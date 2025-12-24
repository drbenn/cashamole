export type CategoryUsageType = 'transaction' | 'asset' | 'liability';
export enum CategoryUsageEnum {
  TRANSACTION = 'transaction',
  ASSET = 'asset',
  LIABILITY = 'liability'
}
export interface CategoryDto {
    id?: string
    user_id?: string
    usage_type: CategoryUsageType
    name: string
    sort_order?: number
    is_system: boolean        // for maintaining a non-renamable/non-deactivatable 'Uncategorized' category if a user decides to delete a category all will be moved to this category
    active?: boolean          // instead of delete record
    created_at?: string       // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
    updated_at?: string       // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
}

export interface CreateCategoryDto {
  name: string;
  usage_type: CategoryUsageType
  // Note: user_id is added in the NestJS service from the JWT
}

// For updating/renaming
export interface UpdateCategoryDto {
  id: string;
  name?: string;       // Only editable if is_system is false
  sort_order?: number; // Used for drag-and-drop
  active?: boolean;    // Used for soft-delete/deactivation
}

/**
 * Bulk Reorder Request
 */
export interface ReorderCategoriesDto {
  categoryIds: string[]; // Ordered list of UUIDs
}

export interface DeactivateCategoryDto {
  category_id: string
  usage_type: CategoryUsageType 
}

export interface SetCategoriesDto {
  transaction: CategoryDto[]
  asset: CategoryDto[]
  liability: CategoryDto[]
}