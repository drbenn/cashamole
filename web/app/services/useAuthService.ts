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
    // 1. Initialize headers object
    const headers: Record<string, string> = {};

    // 2. Check if we are on the server (SSR context)
    if (import.meta.server) {
      // Get all request headers from the incoming client request
      const requestHeaders = useRequestHeaders();
      
      // If a cookie header exists, use it. This sends the client's cookie to the backend.
      if (requestHeaders.cookie) {
        headers['cookie'] = requestHeaders.cookie;
      }
      
      // Optionally, you may need to explicitly include the Authorization header if 
      // your token is in a header, but for cookie-based auth, 'cookie' is key.
    }

    try {
      const response = await $fetch(`${apiBase}/auth/login-cached`, {
        method: 'GET',
        // 'include' is still good for the client side, but we must manually add headers for SSR
        credentials: 'include', 
        headers: headers // Attach the manually extracted cookie header (if on server)
      });
      
      console.log('API Success:', response);
      
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      console.error('API Error during login-cached:', error.data?.message);
      
      // The 401 response will land here, which is correct for an invalid token
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