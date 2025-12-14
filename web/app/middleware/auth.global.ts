// middleware/auth.global.ts

import { useUserStore } from "@/stores/userStore";
import type { RouteLocationNormalized } from "vue-router";
import { useAuthService } from "~/services/useAuthService";

// Routes where a logged-in user should be redirected FROM (e.g., the root landing page).
const REDIRECT_FROM_GUEST_ROUTES = [
  '/', 
];

// Routes where we should NOT run the expensive loginCachedUser API check,
// as the user is actively engaged in the sign-in/registration flow.
const NO_CACHE_CHECK_ROUTES = [
  '/auth/sign-in',
  '/auth/register',
  '/auth/register-success',
  '/auth/confirmation-resend-success',
  '/auth/request-password-reset',
  '/auth/request-password-reset-success',
  '/auth/reset-password',
  '/auth/verify-email'
];

// All pages accessible without an active session (The full public list).
const GUEST_ROUTES = [
  ...REDIRECT_FROM_GUEST_ROUTES,
  // Add other permanent public pages here (e.g., /docs, /about)
  '/docs',
  '/about',
  ...NO_CACHE_CHECK_ROUTES
];


export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const userStore = useUserStore();
  const { loginCachedUser } = useAuthService();

  // --- 1. Fast, Synchronous Check (After initial login) ---
  // If the user is logged in locally and tries to go to a restricted public entry point, redirect them.
  if (userStore.isLoggedIn && REDIRECT_FROM_GUEST_ROUTES.includes(to.path)) {
    console.log(2, 'Redirecting logged-in user from restricted public entry point');
    return navigateTo('/dashboard'); // Use '/dashboard' as the default protected home route
  }

  // --- 2. Not Logged In Locally: Check for Cached Session (API Call) ---
  // This runs if the store is empty AND we are not on a sign-in/register page.
  if (
    !userStore.isLoggedIn &&
    !NO_CACHE_CHECK_ROUTES.includes(to.path)
  ) {
    console.log(3, 'Attempting cached API login...');
    
    // Perform the ASYNCHRONOUS API CHECK
    const cachedLogin = await loginCachedUser(); 
    
    if (cachedLogin.success) {
      console.log(4, 'API check succeeded. Setting user data.');
      
      // SUCCESS: API confirmed session. Set state.
      userStore.setUserData(cachedLogin.data);
      
      // If the user landed on a route they should be redirected from (like '/'), redirect them.
      if (REDIRECT_FROM_GUEST_ROUTES.includes(to.path)) {
        return navigateTo('/dashboard'); 
      }
      
      return; // Allow navigation to proceed (even if it's to /docs, now they are logged in)
      
    } else {
      console.log(5, 'API check failed. No valid token found.');
      
      // FAILURE: If the user was trying to access a protected route (/dashboard), 
      // redirect them to the sign-in page.
      if (!GUEST_ROUTES.includes(to.path)) {
        return navigateTo('/auth/sign-in');
      }
      
      // If they were already on a public route (like '/' or '/docs'), allow them to stay.
      return;
    }
  }

  // --- 3. Default: Allow navigation to proceed ---
  // This covers: 
  // - Logged-in user navigating to a protected page.
  // - Logged-in user navigating to a general public page (/docs).
  // - Logged-out user navigating to a sign-in page or a general public page.
  console.log(6, 'Navigation allowed.');
});