<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'

const form = ref({
  email: '',
  password: '',
  staySignedIn: false,
})

const showPassword = ref(false)
const isLoading = ref(false)

const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    console.error('Email and password required')
    return
  }

  isLoading.value = true

  try {
    // TODO: Call backend login endpoint
    // const response = await $fetch('/api/auth/login', {
    //   method: 'POST',
    //   body: {
    //     email: form.value.email,
    //     password: form.value.password,
    //   },
    // })

    // TODO: Store tokens and redirect to dashboard
    // await navigateTo('/dashboard')

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
            <Cube class="w-6 h-6 text-white" />
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

          <!-- Stay Signed In & Forgot Password -->
          <div class="flex items-center justify-between pt-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="form.staySignedIn"
                type="checkbox"
                class="w-4 h-4 border border-gray-300 rounded accent-black cursor-pointer"
              >
              <span class="text-sm text-gray-700">Stay Signed In</span>
            </label>
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
            class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Signing in...
            </span>
          </button>
        </form>

        <!-- OAuth Section (MVP Note) -->
        <!-- <div class="mt-6">
          <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500 text-xs uppercase tracking-wider">
                Or Continue With
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled
              class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="OAuth coming in future release"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="ml-2 text-sm font-medium">Google</span>
            </button>
            <button
              type="button"
              disabled
              class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="OAuth coming in future release"
            >
              <Github class="w-5 h-5" />
              <span class="ml-2 text-sm font-medium">GitHub</span>
            </button>
          </div>
        </div> -->
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