import { CategoryUsageEnum, type CategoryDto, type CreateCategoryDto, type MigrateDeactivateCategoryDto, type SetCategoriesDto } from '@common-types';
import { defineStore } from 'pinia'
import { useCategoryService } from '~/services/useCategoryService'
import { useAppStore } from '~/stores/appStore'
import { useTransactionStore } from '~/stores/transactionStore'
import { useSnapshotStore } from '~/stores/snapshotStore'



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
    async migrateThenDeactivateCategory(dto: MigrateDeactivateCategoryDto) {
      const { handleErrorToast, handleSuccessToast } = useAppStore()
      if (!dto.category_id) {
        handleErrorToast('Cannot Deactivate: no category id provided.')
        return
      }
      const { migrateThenDeactivateCategory } = useCategoryService()
      const result = await migrateThenDeactivateCategory(dto)
      console.log('store restu: ', result);
      if (result.success) {
        handleSuccessToast(`${dto.usage_type} category deactivated`)
        // remove category in state
        const categories: CategoryDto[] = this[dto.usage_type]
        const updatedCategories = categories.filter((cat: CategoryDto) => cat.id !== dto.category_id)
        this[dto.usage_type] = updatedCategories

        // TODO: update transactions with migrated category id
        if (dto.usage_type === CategoryUsageEnum.TRANSACTION) {
          // todo
          const { updateMigratedTransactionCategory } = useTransactionStore()
          updateMigratedTransactionCategory(dto.category_id, dto.migrate_target_category_id)
        } else if (dto.usage_type === CategoryUsageEnum.ASSET || dto.usage_type === CategoryUsageEnum.LIABILITY) {
          // todo
          const { updateMigratedSnapshotCategory } = useSnapshotStore()
          updateMigratedSnapshotCategory(dto)
        }
      } else {
        console.error(result)
        handleErrorToast(result.error)
      }
    },
  },
})