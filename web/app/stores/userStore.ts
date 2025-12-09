import type { User } from '@common-types';
import { defineStore } from 'pinia'
import { useAuthService } from '~/services/useAuthService'
import type { ApiResponse } from '~/types/app.types';

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false as boolean,
    id: null as string | null,
    email: '' as string | null,
    createdAt: null as Date | null,
    updatedAt: null as Date | null,
    profiles: null as any | null,
    providers: null as any | null,
    settings: null as any | null
  }),

  getters: {
    // Example: A computed value based on user data
    displayName: (state) => (state.email ? state.email.split('@')[0] : 'Guest'),
  },

  actions: {
    setUserData(user: User) {
      const { id, email, created_at, updated_at, profiles, providers, settings } = user
      this.id = id
      this.email = email
      this.createdAt = new Date(created_at)
      this.updatedAt = new Date(updated_at)
      this.profiles = profiles
      this.providers = providers
      this.settings = settings

      this.isLoggedIn = true

      console.log('user stroe is logged inL: ', this.isLoggedIn);
      
    },
    // async login(credentials: any) {
    //   // 1. Access the auxiliary store (appStore)
    //   const appStore = useAppStore();
      
    //   try {
    //     appStore.setLoading(true); // Set global loading state

    //     // 2. Perform API/Auth logic here
    //     // const response = await api.login(credentials); 

    //     // Assume successful login for demo
    //     this.isLoggedIn = true;
    //     this.id = 'uuid-12345';
    //     this.email = credentials.email;
    //     this.isVerified = true; 

    //     appStore.setError(null); // Clear any global errors

    //   } catch (error) {
    //     appStore.setError('Login failed. Please check credentials.'); // Set global error
    //     console.error(error);

    //   } finally {
    //     appStore.setLoading(false); // Clear global loading state
    //   }
    // },
    
    async logout() {
      // Reset user state
      try {
        const { logoutApi } = useAuthService()
        const result: ApiResponse = await logoutApi()
        if (result.success) {
          navigateTo({
            path: '/'
          })
        }
      } catch (err) {
        const { showToast } = useAppStore()
        showToast({
          message: 'Error Loggin Out',
          description: 'Unable to logout',
          position: 'top-center',
          duration: 4000,
          type: 'error'
        });
        console.error(err)
      }
      this.$reset(); 
    },
  },
})