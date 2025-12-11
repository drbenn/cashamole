<script setup lang="ts">
import { ref, computed } from 'vue'
import { Box, Lock, Eye, EyeOff, Loader2, Check, X } from 'lucide-vue-next'
import type { ApiResponse } from '~/types/app.types'
import type { ResetPasswordDto } from '@common-types'
import { useAuthService } from '~/services/useAuthService'

const form = ref({
  newPassword: '',
  confirmPassword: '',
})

const route = useRoute();
const emailQuery = route.query.email as string || ''
const codeQuery = route.query.code as string || ''
const idQuery = route.query.id as string || ''

const { setUserData } = useUserStore()
const { resetPassword } = useAuthService()
const { showToast } = useAppStore()

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const isVerificationStale = ref(false)

const passwordsMatch = computed(() => {
  if (!form.value.confirmPassword) return false
  return form.value.newPassword === form.value.confirmPassword
})

const passwordStrength = computed(() => {
  const password = form.value.newPassword
  let strength = 0

  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  return strength
})

const getStrengthColor = () => {
  if (passwordStrength.value <= 1) return 'bg-red-500'
  if (passwordStrength.value <= 2) return 'bg-yellow-500'
  if (passwordStrength.value <= 3) return 'bg-blue-500'
  return 'bg-green-500'
}

const getStrengthTextColor = () => {
  if (passwordStrength.value <= 1) return 'text-red-600'
  if (passwordStrength.value <= 2) return 'text-yellow-600'
  if (passwordStrength.value <= 3) return 'text-blue-600'
  return 'text-green-600'
}

const getStrengthText = () => {
  if (form.value.newPassword.length === 0) return ''
  if (passwordStrength.value <= 1) return 'Weak password'
  if (passwordStrength.value <= 2) return 'Fair password'
  if (passwordStrength.value <= 3) return 'Good password'
  return 'Strong password'
}

const handleResetPassword = async () => {
  if (!form.value.newPassword || !form.value.confirmPassword) {
    console.error('All fields are required')
    return
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    console.error('Passwords do not match')
    return
  }

  if (form.value.newPassword.length < 8) {
    console.error('Password must be at least 8 characters')
    return
  }

  isLoading.value = true

  try {
    const dto: ResetPasswordDto = {
      code: codeQuery,
      email: emailQuery,
      id: idQuery,
      password: form.value.confirmPassword
    }

    const response: ApiResponse = await resetPassword(dto)

    if (!response.success && response.error.includes('stale')) {
      isVerificationStale.value = true
      errorMessage.value = response.error
    }
    else if (response.success && response.data) {
      showToast({
        message: 'Password Reset',
        description: 'Password updated successfully!',
        position: 'top-right',
        duration: 5000,
        type: 'success'
      });
      setUserData(response.data)
      navigateTo({
        path: '/home',
      })
    }
    else if (response.error) {
      errorMessage.value = response.error
    }
  } finally {
    isLoading.value = false
  }
}
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
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">Reset Password</h1>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <form class="space-y-5" @submit.prevent="handleResetPassword">
          <!-- New Password Field -->
          <div class="space-y-2">
            <label for="newPassword" class="block text-sm font-medium text-gray-900">
              New Password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="newPassword"
                v-model="form.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                required
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                @click="showNewPassword = !showNewPassword"
              >
                <Eye v-if="showNewPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <!-- Password Strength Indicator -->
            <div class="mt-2">
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  :class="[
                    'h-1 flex-1 rounded-full transition-colors',
                    i <= passwordStrength ? getStrengthColor() : 'bg-gray-200'
                  ]"
                />
              </div>
              <p class="text-xs mt-1.5 font-medium" :class="getStrengthTextColor()">
                {{ getStrengthText() }}
              </p>
            </div>
          </div>

          <!-- Confirm New Password Field -->
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
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <Eye v-if="showConfirmPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <!-- Password Match Indicator -->
            <div v-if="form.confirmPassword" class="text-xs mt-1.5 font-medium" :class="passwordsMatch ? 'text-green-600' : 'text-red-600'">
              <span v-if="passwordsMatch" class="flex items-center gap-1">
                <Check class="w-3 h-3" />
                Passwords match
              </span>
              <span v-else class="flex items-center gap-1">
                <X class="w-3 h-3" />
                Passwords don't match
              </span>
            </div>
          </div>

          <!-- Reset Password Button -->
          <button
            type="submit"
            :disabled="isLoading || !passwordsMatch || form.newPassword.length < 8"
            class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            <span v-if="!isLoading">Reset Password</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Resetting...
            </span>
          </button>
        </form>
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

