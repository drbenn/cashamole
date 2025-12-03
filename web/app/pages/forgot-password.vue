<script setup lang="ts">
import { ref } from 'vue'
import { Mail, Loader2 } from 'lucide-vue-next'

const form = ref({
  email: '',
})

const isLoading = ref(false)

const handleForgotPassword = async () => {
  if (!form.value.email) {
    console.error('Email is required')
    return
  }

  isLoading.value = true

  try {
    // TODO: Call backend forgot password endpoint
    // const response = await $fetch('/api/auth/forgot-password', {
    //   method: 'POST',
    //   body: {
    //     email: form.value.email,
    //   },
    // })

    // TODO: Show success message or redirect to confirmation page
    // await navigateTo(`/reset-password-sent?email=${encodeURIComponent(form.value.email)}`)

    console.log('Forgot password request:', form.value.email)
    // Simulated success
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Reset instructions sent!')
  } catch (error) {
    console.error('Forgot password error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8 cursor-default">
        <h1 class="text-4xl font-bold text-gray-900 mb-3">Reset password</h1>
        <p class="text-gray-600 leading-relaxed">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <form class="space-y-5" @submit.prevent="handleForgotPassword">
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

          <!-- Send Reset Instructions Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-black text-white font-semibold py-2.5 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            <span v-if="!isLoading">Send reset instructions</span>
            <span v-else class="flex items-center justify-center">
              <Loader2 class="w-4 h-4 animate-spin mr-2" />
              Sending...
            </span>
          </button>
        </form>
      </div>

      <!-- Sign In Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 cursor-default">
          Remember your password?
          <NuxtLink
            to="/login"
            class="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
