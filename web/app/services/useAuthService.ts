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
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
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

  const requestNewVerificationEmail = async (dto: RequestNewVerificationDto): Promise<ApiResponse> => {
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

  const requestPasswordReset = async (dto: RequestPasswordResetDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/auth/request-password-reset`, {
        method: 'POST',
        body: dto,
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
    verifyEmail,
    requestNewVerificationEmail,
    requestPasswordReset,
    resetPassword,
    logoutApi,
  }
}