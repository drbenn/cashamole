<script setup lang="ts">
import { ref } from 'vue'
import { Mail, Loader2 } from 'lucide-vue-next'
import type { RequestNewVerificationDto, RequestPasswordResetDto } from '@common-types'
import type { ApiResponse } from '~/types/app.types'
import { useAuthService } from '~/services/useAuthService'

const { requestPasswordReset, requestNewVerificationEmail } = useAuthService()
const { showToast } = useAppStore()

const form = ref({
  email: '',
})

const isLoading = ref(false)
const isResendLoading = ref(false)
const isResendConfirmationAvailable = ref(false)
const emailForResend = ref('')

const errorMessage = ref('')

const handleRequestPasswordReset = async () => {
  if (!form.value.email) {
    console.error('Email is required')
    return
  }

  isLoading.value = true

  try {
    const dto: RequestPasswordResetDto = {
      email: form.value.email,
    }

    const response: ApiResponse = await requestPasswordReset(dto)
    if (response.success) {
      navigateTo({
        path: '/auth/request-password-reset-success',
        query: {
          email: response.data.email,
          created_at: response.data.created_at
        }})
    } else {
      errorMessage.value = response.error

      if (response.error.includes('not verified')) {
        isResendConfirmationAvailable.value = true
        emailForResend.value = response.data.email
      }
      showToast({
        message: response.error,
        position: 'top-right',
        duration: 5000,
        type: 'error'
      });
    }
  } catch (error: unknown | any) {
    console.error('Request password reset error:', error)
    showToast({
      message: 'Error',
      description: error,
      position: 'top-right',
      duration: 5000,
      type: 'error'
    });
  } finally {
    isLoading.value = false
  }
}

const handleResendConfirmation = async () => {
  isResendLoading.value = true
  try {
    const dto: RequestNewVerificationDto = { email: emailForResend.value }
    const response: ApiResponse = await requestNewVerificationEmail(dto)
    if (response.success) {
      navigateTo({
        path: '/auth/confirmation-resend-success',
        query: {
          email: response.data.email,
          created_at: response.data.created_at
        }})
    } else {
      showToast({
        message: response.error,
        position: 'top-right',
        duration: 5000,
        type: 'error'
      });
    }
  } catch (error: unknown | any) {
    console.error('Resend verification code error:', error)
    showToast({
      message: 'Error',
      description: error,
      position: 'top-right',
      duration: 5000,
      type: 'error'
    });
  } finally {
    isResendLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8 cursor-default">
        <h1 class="text-4xl font-bold text-gray-900 mb-3">Forgot password?</h1>
        <p class="text-gray-600 leading-relaxed">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <form class="space-y-5" @submit.prevent="handleRequestPasswordReset">
          <!-- Email Field -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-900">
              Email address
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="user@example.com"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required
              >
            </div>
          </div>

          <div v-if="true" class="text-red-700">{{ errorMessage }}</div>

          <!-- Send Reset Instructions Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            <span v-if="!isLoading">Request Reset</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Sending...
            </span>
          </button>
        </form>

        <!-- Resend Confirmation Button -->
        <button
          v-if="isResendConfirmationAvailable"
          type="button"
          v-on:click="handleResendConfirmation"
          :disabled="isResendLoading || !isResendConfirmationAvailable"
          class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
        >
          <span v-if="!isResendLoading">Resend Confirmation Email</span>
          <span v-else class="flex items-center justify-center">
            <Loader2 class="w-4 h-4 animate-spin mr-2" />
            Resending Confirmation...
          </span>
        </button>

      </div>

      <!-- Sign In Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 cursor-default">
          Remember your password?
          <NuxtLink
            to="/auth/sign-in"
            class="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
