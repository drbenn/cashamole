<script setup lang="ts">
import { ref } from 'vue'
import { Box, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useAuthService } from '~/services/useAuthService'
import type { ApiResponse } from '~/types/app.types'
import type { LoginUserDto } from '@common-types'

const form = ref({
  email: '',
  password: '',
})

const { login } = useAuthService()
const { setUserData } = useUserStore()

const showPassword = ref(false)
const isLoading = ref(false)

const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    console.error('Email and password required')
    return
  }

  isLoading.value = true

  try {
    const dto: LoginUserDto = {
      email: form.value.email,
      password: form.value.password
    }

    const response: ApiResponse = await login(dto)
    console.log('resss: ', response);
    if (response.success) {
      setUserData(response.data)
      navigateTo({
        path: '/home',
      })
    }
    console.log('Login attempt:', form.value)
    // Simulated success
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Login successful!')
  } catch (error) {
    console.error('Login error:', error)
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
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">Sign In</h1>
      </div>

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
              to="/forgot-password"
              class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              Forgot Password?
            </NuxtLink>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-0"
          >
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Signing in...
            </span>
          </button>
        </form>
      </div>

      <!-- Register Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 cursor-default">
          No account yet?
          <NuxtLink
            to="/register"
            class="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Register Now
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>