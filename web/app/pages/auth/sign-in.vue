<script setup lang="ts">
import { ref } from 'vue'
import { Box, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useAuthService } from '~/services/useAuthService'
import type { ApiResponse } from '~/types/app.types'
import type { LoginUserDto, RequestNewVerificationDto } from '@common-types'
import { z } from 'zod'
import CashBox from '~/components/custom/shared/CashDrop.vue'
import CashInput from '~/components/custom/shared/CashInput.vue'
const form = ref({
  email: '',
  password: '',
})

const { login, requestNewVerificationEmail } = useAuthService()
const { setUserData } = useUserStore()
const { showToast } = useAppStore()

const emailSchema = z.string().email()
const showPassword = ref(false)
const isLoading = ref(false)
const isResendLoading = ref(false)
const errorMessage = ref('')
const isResendConfirmationAvailable = ref(false)
const emailForResend = ref('')

const isEmailValid = computed((): boolean => {
  try {
    emailSchema.parse(form.value.email)
    return true
  } catch {
    return false
  }
})

const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    console.error('Email and password required')
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    const dto: LoginUserDto = {
      email: form.value.email,
      password: form.value.password
    }

    const response: ApiResponse = await login(dto)
    if (response.success) {
      setUserData(response.data)
      navigateTo({
        path: '/home',
      })
    } else {
      errorMessage.value = response.error

      if (response.error.includes('not verified')) {
        isResendConfirmationAvailable.value = true
        emailForResend.value = response.data.email
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Error communicating with server'
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

const cbOptions = [
  { value: 'amazon_services', label: 'Amazon Services' },
  { value: 'utility_company', label: 'Utility Company' },
  { value: 'microsoft_corp', label: 'Microsoft Corporation' },
  { value: 'local_grocery', label: 'Local Grocery Store' },
  { value: 'gas_station', label: 'Gas Station' },
  { value: 'software_a', label: 'Software Subscription A' },
]
const cbSuggestions = [
  'Amazon Services',
  'Utility Company',
  'Microsoft Corporation',
  'Local Grocery Store',
  'Gas Station',
  'Software Subscription A'
]

// 3. Define the reactive variable to hold the selected value
// This variable will automatically be updated by v-model
const cbValue = ref('gas_station')
const cbLabel = ref('Gas Station')
</script>


<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
            <Box class="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">Sign In</h1>
      </div>


      <CashBox 
        v-model:value="cbValue"
        v-model:label="cbLabel"
        :options="cbOptions"
        :placeholder="'🔮'"
      />
      <CashInput 
        v-model="cbValue"
        :options="cbSuggestions"
        :placeholder="'Enter text...'"
        :icon="'🔮'"
      />


      <!-- Form Card -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <form class="space-y-5" @submit.prevent="handleLogin">
          <!-- Email Field -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="user@example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              required
            >
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-900">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
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

          <!-- Forgot Password -->
          <div class="flex items-center justify-end pt-0 w-full">
            <NuxtLink
              to="/auth/request-password-reset"
              class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors h-4"
            >
              Forgot Password?
            </NuxtLink>
            
          </div>
          <div v-if="true" class="text-red-700">{{ errorMessage }}</div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="isLoading || !isEmailValid || form.password.length < 8 || isResendConfirmationAvailable"
            class="w-full bg-gray-500 text-white font-semibold py-2.5 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Signing in...
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

      <!-- Register Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 cursor-default">
          No account yet?
          <NuxtLink
            to="/auth/register"
            class="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Register Now
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>