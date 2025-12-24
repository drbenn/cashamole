import type { CreateCategoryDto } from '@common-types';
import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import type { ToastPayload } from '~/types/app.types';
import { useCategoryService } from '~/services/useCategoryService'


export const useAppStore = defineStore('app', {
state: () => ({
    // Typically, the appStore also holds global UI state, 
    // but for the toast system, state is often empty:
    // loading: false,
  }),
  
  // No getters needed for the toast system

  actions: {
    async createCategory(dto: CreateCategoryDto) {
      const { createCategory } = useCategoryService()
      const result = await createCategory(dto)
      console.log('store restu: ', result);
      if (result.success) {
        this.handleSuccessToast(`${result.data.usage_type} category ${result.data.name} created`)
        // TODO: update categories with newly saved category
      } else {
        console.error(result)
        this.handleErrorToast(result.error)
      }
    },
    handleErrorToast(message: string) {
      this.showToast({
        message: message,
        position: 'top-right',
        duration: 5000,
        type: 'error'
      })
    },
    handleSuccessToast(message: string) {
      this.showToast({
        message: message,
        position: 'top-right',
        duration: 3000,
        type: 'success'
      })
    },
    /**
     * Triggers a global toast notification.
     * This is now explicitly defined as an action.
     * @param payload - Object containing the message and all other toast options.
     */
    showToast(payload: ToastPayload) {
      if (import.meta.client) {
        // Destructure the payload to separate the main message and type from the options
        const { message, type = 'default', ...options } = payload;
        
        // The rest of the logic remains the same: using the spread operator 
        // to pass all optional ExternalToast properties (like position, duration, class)
        
        switch (type) {
          case 'success':
            toast.success(message, options);
            break;
          case 'error':
            toast.error(message, options);
            break;
          case 'warning':
            toast.warning(message, options);
            break;
          case 'info':
            toast.info(message, options);
            break;
          case 'default':
          default:
            toast(message, options);
            break;
        }
      }
    },
  },
})