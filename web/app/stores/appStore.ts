import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import type { ToastPayload } from '~/types/app.types';

export const useAppStore = defineStore('app', {
state: () => ({
    // Typically, the appStore also holds global UI state, 
    // but for the toast system, state is often empty:
    // loading: false,
  }),
  
  // No getters needed for the toast system

  actions: {
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