import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null as string | null,
    email: '' as string,
    isVerified: false as boolean,
    status: false as boolean,
    isLoggedIn: true as boolean,
  }),

  getters: {
    // Example: A computed value based on user data
    displayName: (state) => (state.email ? state.email.split('@')[0] : 'Guest'),
  },

  actions: {
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
    
    logout() {
      // Reset user state
      this.$reset(); 
      // Note: Pinia provides a built-in $reset() method to restore the state to its initial value.
    },
  },
})