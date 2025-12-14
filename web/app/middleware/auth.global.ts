// middleware/auth.global.ts

import { useUserStore } from "@/stores/userStore";
import type { RouteLocationNormalized } from "vue-router";
import { useAuthService } from "~/services/useAuthService";

// Define the routes that DO NOT require a logged-in user
const GUEST_ROUTES = [
  '/',
  '/auth/sign-in',
  '/auth/register',
  '/auth/register-success',
  '/auth/confirmation-resend-success',
  '/auth/request-password-reset',
  '/auth/request-password-reset-success',
  '/auth/reset-password',
  '/auth/verify-email'
];

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const userStore = useUserStore();
  const { loginCachedUser } = useAuthService();

  // --- 1. Fast, Synchronous Check (After initial login) ---
  // If the user is logged in locally and tries to go to a guest page, redirect them home.
  if (userStore.isLoggedIn && GUEST_ROUTES.includes(to.path)) {
    return navigateTo('/home');
  }

  // --- 2. Check Required: If the user needs to access a protected route ---
  if (!userStore.isLoggedIn && !GUEST_ROUTES.includes(to.path)) {
    
    // We are trying to access a protected route (e.g., /home) but the local store is empty.
    
    // Perform the ASYNCHRONOUS API CHECK (This blocks navigation until complete)
    const cachedLogin = await loginCachedUser(); 
    
    if (cachedLogin.success) {
      // SUCCESS: API confirmed session. Set state and allow navigation to proceed.
      userStore.setUserData(cachedLogin.data);
      // The middleware returns nothing, allowing the intended 'to' route to load.
      return; 

    } else {
      // FAILURE: No valid cached token found. Redirect to the sign-in page.
      // This immediately stops the current navigation.
      return navigateTo('/');
    }
  }

  // --- 3. Default: Allow navigation to proceed (either public route or user is already logged in) ---
});