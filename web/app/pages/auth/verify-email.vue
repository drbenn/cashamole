<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShieldCheck, Loader2 } from 'lucide-vue-next'
import type { RequestNewVerificationDto, VerifyRegistrationDto } from '@common-types'
import { useAuthService } from '~/services/useAuthService'
import type { ApiResponse } from '~/types/app.types'


const { showToast } = useAppStore()
const { verifyEmail, requestNewVerificationEmail } = useAuthService()
const { setUserData } = useUserStore()


const code = ref(['', '', '', '', '', ''])
const isLoading = ref(false)
const isResendLoading = ref(false)

const verificationErrorMessage = ref('')
const isResendConfirmationAvailable = ref(false)


const route = useRoute();
const emailQuery = route.query.email as string || ''
const idQuery = route.query.id as string || ''

const fullCode = computed(() => code.value.join(''))

const handleCodeInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value

  // Allow only numbers
  if (!/^\d*$/.test(value)) {
    code.value[index] = ''
    return
  }

  code.value[index] = value

  // Auto-focus next field if digit entered
  if (value && index < 5) {
    const nextInput = document.querySelectorAll('input[type="text"]')[index + 1] as HTMLInputElement
    nextInput?.focus()
  }
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !code.value[index] && index > 0) {
    const prevInput = document.querySelectorAll('input[type="text"]')[index - 1] as HTMLInputElement
    prevInput?.focus()
  }

  if (event.key === 'ArrowLeft' && index > 0) {
    const prevInput = document.querySelectorAll('input[type="text"]')[index - 1] as HTMLInputElement
    prevInput?.focus()
  }

  if (event.key === 'ArrowRight' && index < 5) {
    const nextInput = document.querySelectorAll('input[type="text"]')[index + 1] as HTMLInputElement
    nextInput?.focus()
  }
}

const handleVerify = async () => {
  if (fullCode.value.length !== 6) {
    console.error('Please enter all 6 digits')
    return
  }

  isLoading.value = true

  try {
    const dto: VerifyRegistrationDto = {
      code: fullCode.value as string,
      id: idQuery
    }

    const response: ApiResponse = await verifyEmail(dto)

    if (!response.success && response.error.includes('stale')) {
      isResendConfirmationAvailable.value = true
      verificationErrorMessage.value = response.error
    }
    else if (!response.success && response.error.includes('Incorrect account verification code submitted')) {
      isResendConfirmationAvailable.value = true
      verificationErrorMessage.value = response.error
    }
    else if (response.success && response.data) {
      setUserData(response.data)
      navigateTo({
        path: '/dashboard',
      })
    }
    else if (response.error) {
      verificationErrorMessage.value = response.error
    }
    
  } catch (error: unknown) {
    console.error('Account verification error:', error)
    verificationErrorMessage.value = 'Registration Failed: API Error'
  } finally {
    isLoading.value = false
  }
}

const handleResendConfirmation = async () => {
  isResendLoading.value = true
  try {
    const dto: RequestNewVerificationDto = { email: emailQuery }
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
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <ShieldCheck class="w-8 h-8 text-gray-700" />
          </div>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Account verification</h1>
        <p class="text-gray-600">
          Enter the 6-digit code sent to your email address.
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <form class="space-y-0" @submit.prevent="handleVerify">
          <!-- Code Input Fields -->
          <div class="flex justify-center gap-2">
            <input
              v-for="(digit, index) in code"
              :key="index"
              v-model="code[index]"
              type="text"
              maxlength="1"
              inputmode="numeric"
              class="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all bg-white text-gray-900"
              @input="handleCodeInput(index, $event)"
              @keydown="handleKeydown(index, $event)"
            >
          </div>
          <div class="min-h-6 py-2">
            <span v-if="verificationErrorMessage" class="text-red-700">{{ verificationErrorMessage }}</span>
          </div>

          <!-- Verify Button -->
          <button
            type="submit"
            :disabled="isLoading || code.join('').length < 6"
            class="w-full bg-gray-500 text-white font-semibold py-2.5 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="!isLoading">Verify code</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Verifying...
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
    </div>
  </div>
</template>
