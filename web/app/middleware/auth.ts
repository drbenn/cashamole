import { useUserStore } from "@/stores/userStore"
import type { RouteLocationNormalized } from "vue-router";

export default defineNuxtRouteMiddleware((to:RouteLocationNormalized, from: RouteLocationNormalized) => {
  const userStore = useUserStore()

  // 1. Check if the user is NOT logged in
  if (!userStore.isLoggedIn) {
    // 2. Prevent access to the protected route and redirect to sign-in
    return navigateTo('/')
  }

  // 3. If logged in, allow the navigation
})