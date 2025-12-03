<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ShieldCheck, Loader2, Clock } from 'lucide-vue-next'

const code = ref(['', '', '', '', '', ''])
const isLoading = ref(false)
const isResending = ref(false)
const canResend = ref(false)
const resendCountdown = ref(0)

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
    // TODO: Call backend verification endpoint
    // const response = await $fetch('/api/auth/verify-email', {
    //   method: 'POST',
    //   body: {
    //     code: fullCode.value,
    //   },
    // })

    // TODO: Redirect to dashboard or login on success
    // await navigateTo('/dashboard')

    console.log('Verification code:', fullCode.value)
    // Simulated success
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Email verified successfully!')
  } catch (error) {
    console.error('Verification error:', error)
    // Reset code on error
    code.value = ['', '', '', '', '', '']
  } finally {
    isLoading.value = false
  }
}

const handleResend = async () => {
  isResending.value = true
  canResend.value = false
  resendCountdown.value = 30

  try {
    // TODO: Call backend resend code endpoint
    // const response = await $fetch('/api/auth/resend-verification-code', {
    //   method: 'POST',
    // })

    console.log('Resend code requested')
    // Simulated success
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('Resend error:', error)
  } finally {
    isResending.value = false
  }
}

// Countdown timer
watch(() => resendCountdown.value, (newVal) => {
  if (newVal > 0) {
    setTimeout(() => {
      resendCountdown.value = newVal - 1
    }, 1000)
  } else if (newVal === 0 && resendCountdown.value === 0) {
    canResend.value = true
  }
}, { immediate: false })

// Initialize resend countdown on mount
onMounted(() => {
  resendCountdown.value = 30
})
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
        <form class="space-y-6" @submit.prevent="handleVerify">
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

        <!-- Resend Code Section -->
        <div class="mt-6 text-center">
          <button
            v-if="canResend"
            :disabled="isResending"
            class="text-gray-900 hover:text-gray-600 transition-colors disabled:opacity-50"
            @click="handleResend"
          >
            <span v-if="!isResending">Resend code</span>
            <span v-else class="flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" />
              Sending...
            </span>
          </button>
          <div v-else class="flex items-center justify-center gap-2 text-gray-600">
            <Clock class="w-4 h-4" />
            <span>Resend code in {{ resendCountdown }}s</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
