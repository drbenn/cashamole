import type { MigrateDeactivateCategoryDto, TransactionDto } from '@common-types'
import { defineStore } from 'pinia'
// import { toast } from 'vue-sonner'
// import type { ToastPayload } from '~/types/app.types';

interface SnapshotState {
  transactions: TransactionDto[],
  // categorySuggestions: string[],
  // vendorSuggestions: Record<string, string[]>,
}

export const useSnapshotStore = defineStore('snapshot', {
state: (): SnapshotState => ({
  transactions: [
      { id: '1', type: 'expense', transaction_date: new Date().toISOString(), category: 'Food', vendor: 'Taco Bell', amount: 12.5, note: '' },
      { id: '2', type: 'expense', transaction_date: new Date().toISOString(), category: 'Bills', vendor: 'Verizon', amount: 85.00, note: 'Monthly' }
    ],
    categorySuggestions: ['Food', 'Bills'],
    vendorSuggestions: {
        'Food': ['Whole Foods', 'Taco Bell'],
        'Bills': ['Verizon', 'Netflix']
      },
  }),
  
  // No getters needed for the toast system

  actions: {
    async updateMigratedSnapshotCategory(dto: MigrateDeactivateCategoryDto) {
      const { category_id, usage_type, migrate_target_category_id } = dto
      console.log(category_id, usage_type, migrate_target_category_id);
      

    },
    async fetchSuggestions() {
      // try {
      //   // Mock data fetch
      //   this.categorySuggestions = ['Food', 'Bills'];
      //   this.vendorSuggestions = {
      //     'Food': ['Whole Foods', 'Taco Bell'],
      //     'Bills': ['Verizon', 'Netflix']
      //   };
      // } catch (error) {
      //   this.showToast({ message: 'Failed to load suggestions', type: 'error' });
      // }
    },
  },
})