import type { TransactionDto } from '@common-types'
import { defineStore } from 'pinia'
// import { toast } from 'vue-sonner'
// import type { ToastPayload } from '~/types/app.types';

interface SuggestionState {
  transactions: TransactionDto[],
  categorySuggestions: string[],
  vendorSuggestions: Record<string, string[]>,
}

export const useTransactionStore = defineStore('transaction', {
state: (): SuggestionState => ({
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