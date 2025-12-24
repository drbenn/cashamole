import type { CategoryDto, CategoryUsageEnum, CreateCategoryDto, SetCategoriesDto } from '@common-types';
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
        const uodatedCategories = this[usage_type] = [...this[usage_type], result.data]
        this[usage_type] = uodatedCategories
      } else {
        console.error(result)
        handleErrorToast(result.error)
      }
    },
  },
})