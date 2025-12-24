import type { CategoryDto, CategoryUsageEnum, CreateCategoryDto, DeactivateCategoryDto, SetCategoriesDto } from '@common-types';
import { defineStore } from 'pinia'
import { useCategoryService } from '~/services/useCategoryService'
import { useAppStore } from '~/stores/appStore'



interface CategoryState {
  transaction: CategoryDto[],
  asset: CategoryDto[],
  liability: CategoryDto[]
}
export const useCategoryStore = defineStore('category', {
state: (): CategoryState => ({
    transaction: [],
    asset: [],
    liability: []
  }),
  
  // No getters needed for the toast system

  actions: {
    async setUserCategories(categories: SetCategoriesDto) {
      const { handleSuccessToast } = useAppStore()
      this.transaction = categories.transaction
      this.asset = categories.asset
      this.liability = categories.liability
      console.log(this.transaction);
      console.log(this.asset);
      console.log(this.liability);
      handleSuccessToast(`User Categories Set`)
    },
    async createCategory(dto: CreateCategoryDto) {
      const { handleErrorToast, handleSuccessToast } = useAppStore()
      const { createCategory } = useCategoryService()
      const result = await createCategory(dto)
      console.log('store restu: ', result);
      if (result.success) {
        handleSuccessToast(`${result.data.usage_type} category ${result.data.name} created`)
        const usage_type: CategoryUsageEnum = result.data.usage_type
        const updatedCategories = this[usage_type] = [...this[usage_type], result.data]
        this[usage_type] = updatedCategories
      } else {
        console.error(result)
        handleErrorToast(result.error)
      }
    },
    async deactivateCategory(dto: DeactivateCategoryDto) {
      const { handleErrorToast, handleSuccessToast } = useAppStore()
      if (!dto.category_id) {
        handleErrorToast('Cannot Deactivate: no category id provided.')
        return
      }
      const { deactivateCategory } = useCategoryService()
      const result = await deactivateCategory(dto)
      console.log('store restu: ', result);
      if (result.success) {
        handleSuccessToast(`${dto.usage_type} category deactivated`)
        const categories: CategoryDto[] = this[dto.usage_type]
        const updatedCategories = categories.filter((cat: CategoryDto) => cat.id !== dto.category_id)
        this[dto.usage_type] = updatedCategories
      } else {
        console.error(result)
        handleErrorToast(result.error)
      }
    },
  },
})