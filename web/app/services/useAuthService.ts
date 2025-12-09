import type { CreateUserDto, LoginUserDto, RequestNewVerificationDto, VerifyRegistrationDto } from "@common-types"
import type { FetchError } from 'ofetch'
import type { ApiResponse } from "~/types/app.types"

export const useAuthService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl
  console.log('***', apiBase);

  const register = async (dto: CreateUserDto): Promise<ApiResponse> => {
    console.log(apiBase);
    
    try {
      const response = await $fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        body: dto,
      })
      return { success: true, data: response }
    }
    catch (err) {
      console.log(err);
      
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }

  const login = async (dto: LoginUserDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        body: dto,
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }

  const logoutApi = async () => {
    try {
      const response = await $fetch(`${apiBase}/auth/logout`, { method: 'POST' })
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
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }

  const requestNewverificationEmail = async (dto: RequestNewVerificationDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/verify-email-new-request`, {
        method: 'POST',
        body: dto,
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message }
    }
  }









  const forgotPassword = async (email: string): Promise<unknown> => {
    return await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  const resetPassword = async (token: string, password: string): Promise<unknown> => {
    return await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    })
  }



  return {
    register,
    login,
    verifyEmail,
    requestNewverificationEmail,
    forgotPassword,
    resetPassword,
    logoutApi,
  }
}