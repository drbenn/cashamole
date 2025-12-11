<script setup lang="ts">
import { ref } from 'vue'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { z } from 'zod'
import { useAuthService } from '~/services/useAuthService'
import type { CreateUserDto, RequestNewVerificationDto } from '@common-types'
import type { ApiResponse } from '~/types/app.types'
import { Button } from '@/components/ui/button'

const { register, requestNewVerificationEmail } = useAuthService()
const { showToast } = useAppStore()

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
})

const emailSchema = z.string().email()
const emailError = ref('')
const passwordError = ref('')
const errorMessage = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isLoading = ref(false)
const isResendLoading = ref(false)

const isResendConfirmationAvailable = ref(false)
const resendConfirmationemailAddress = ref('')


// non-computed function required for @blur
const validateEmail = () => {
  try {
    emailSchema.parse(form.value.email)
    emailError.value = ''
  } catch (err: unknown) {
    const error = err as Record<string, any>
    emailError.value = error?.errors?.[0]?.message || 'Invalid email'
  }
}

const validatePassword = () => {
  if (form.value.password && form.value.confirmPassword && form.value.password !== form.value.confirmPassword) {
    passwordError.value = 'Passwords must match.'
  } else if (form.value.password && form.value.confirmPassword && form.value.password === form.value.confirmPassword && form.value.password.length < 8) {
    passwordError.value = 'Password must be at least 8 characters long.'
  } else if (form.value.password && form.value.confirmPassword && form.value.password === form.value.confirmPassword && form.value.password.length >= 8) {
    passwordError.value = ''
  }
}

const isEmailValid = computed((): boolean => {
  try {
    emailSchema.parse(form.value.email)
    return true
  } catch {
    return false
  }
})

const isPasswordValid = computed((): boolean => {
  return form.value.password === form.value.confirmPassword && form.value.password.length >= 8
})

const isFormValid = computed((): boolean => {
  return isPasswordValid.value && isEmailValid.value
})

const handleRegister = async () => {
  if (!form.value.email || !form.value.password || !form.value.confirmPassword) {
    console.error('All fields are required')
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    console.error('Passwords do not match')
    return
  }

  if (form.value.password.length < 8) {
    console.error('Password must be at least 8 characters')
    return
  }

  isLoading.value = true

  try {
    const dto: CreateUserDto = {
      email: form.value.email,
      provider: 'email',
      password: form.value.password
    }

    const response: ApiResponse = await register(dto)
    
    if (response.success && response.data) {
      navigateTo({
        path: '/auth/register-success',
        query: {
          email: response.data.email,
          created_at: response.data.created_at
        }
      })
    }
    else if (!response.success) {
      errorMessage.value = response.error
      if (response.error.includes('Email has already been submitted for registration process.')) {
        isResendConfirmationAvailable.value = true
        resendConfirmationemailAddress.value = response.data.email
      }
    }
  } catch (error: unknown) {
    console.error('Registration error:', error)
    errorMessage.value = 'Registration Failed: API Error'
  } finally {
    isLoading.value = false
  }
}

const handleResendConfirmation = async () => {
  isResendLoading.value = true
  try {
    const dto: RequestNewVerificationDto = { email: resendConfirmationemailAddress.value }
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
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Create an account</h1>
        <p class="text-gray-600">Sign up to get started with Cashamole</p>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-lg shadow-sm p-8">

        <!-- Registration Form -->
        <form class="space-y-4" @submit.prevent="handleRegister">

          <!-- Email Field -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-900">
              Email
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="bernie@email.com"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required
                @blur="validateEmail"
              >
            </div>
            <span v-if="emailError" class="text-red-700">{{ emailError }}</span>
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-900">
              Password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="space-y-2">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-900">
              Confirm Password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required
                @blur="validatePassword"
              >
              <Button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <Eye v-if="showConfirmPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </Button>
            </div>
            <span v-if="passwordError" class="text-red-700">{{ passwordError }}</span>
            <span v-if="errorMessage" class="text-red-700">{{ errorMessage }}</span>
          </div>

          <!-- Create Account Button -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid || isResendConfirmationAvailable"
            class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span v-if="!isLoading">Create Account</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Creating account...
            </span>
          </button>

          <!-- Resend Confirmation Button -->
          <button
            v-if="isResendConfirmationAvailable"
            type="button"
            v-on:click="handleResendConfirmation"
            :disabled="isResendLoading || !isResendConfirmationAvailable"
            class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span v-if="!isResendLoading">Resend Confirmation Email</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Resending Confirmation...
            </span>
          </button>
        </form>
      </div>

      <!-- Sign In Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 cursor-default">
          Already have an account?
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

