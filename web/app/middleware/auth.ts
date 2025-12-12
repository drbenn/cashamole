import { useUserStore } from "@/stores/userStore"

export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore()

  // 1. Check if the user is NOT logged in
  if (!userStore.isLoggedIn) {
    // 2. Prevent access to the protected route and redirect to sign-in
    return navigateTo('/auth/sign-in')
  }

  // 3. If logged in, allow the navigation
})