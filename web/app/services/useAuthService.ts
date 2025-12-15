import type { CreateUserDto, LoginUserDto, RequestNewVerificationDto, RequestPasswordResetDto, ResetPasswordDto, VerifyRegistrationDto } from "@common-types"
import type { FetchError } from 'ofetch'
import type { ApiResponse } from "~/types/app.types"

export const useAuthService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl

  const register = async (dto: CreateUserDto): Promise<ApiResponse> => {
    
    try {
      const response = await $fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const login = async (dto: LoginUserDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        body: dto,
        credentials: 'include'  // must include credentials on login in order to accept the jwt cookies received in response
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const loginCachedUser = async (): Promise<ApiResponse> => {
    // 🛑 SOLUTION: Check if we are in the SSG build process.
    // Nitro sets this global variable during the build.
    if (process.env.NUXT_ENV_BUILD_CONTEXT === 'generate') {
        console.log('Skipping loginCached API call during SSG build.');
        return { success: false, error: 'SSG_BYPASS', data: null };
    }

    // 1. Initialize headers object
    const headers: Record<string, string> = {};

    // 2. Check if we are on the server (SSR context) - this is still needed for real SSR
    if (import.meta.server) {
      // Get all request headers from the incoming client request
      const requestHeaders = useRequestHeaders();
      
      // If a cookie header exists, use it. 
      if (requestHeaders.cookie) {
        headers['cookie'] = requestHeaders.cookie;
      }
      // If no cookie is present on the server, headers will be empty, 
      // but we continue to call the API, which is fine for real SSR 
      // where the user may truly be logged out.
    }

    try {
      // Your API call remains here
      const response = await $fetch(`${apiBase}/auth/login-cached`, {
        method: 'GET',
        credentials: 'include', 
        headers: headers 
      });
      
      console.log('API Success:', response);
      
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      // This is where you see the API error on the build server because 
      // the bypass above wasn't there.
      console.error('API Error during login-cached:', error.data?.message);
      
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const logoutApi = async () => {
    try {
      const response = await $fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include' 
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }

  const verifyEmail = async (dto: VerifyRegistrationDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/verify-email`, {
        method: 'POST',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }

  const requestNewVerificationEmail = async (dto: RequestNewVerificationDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/verify-email-new-request`, {
        method: 'POST',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }

  const requestPasswordReset = async (dto: RequestPasswordResetDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/request-password-reset`, {
        method: 'POST',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const resetPassword = async (dto: ResetPasswordDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }

  return {
    register,
    login,
    loginCachedUser,
    verifyEmail,
    requestNewVerificationEmail,
    requestPasswordReset,
    resetPassword,
    logoutApi,
  }
}