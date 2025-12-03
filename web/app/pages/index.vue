<script setup lang="ts">
import { Shield, Smartphone, TrendingUp } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">

    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center max-w-2xl mx-auto">
        <h1 class="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
          Take Control of Your Money
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          A privacy-first platform to manage your finances across web and desktop. Track, sync, and grow your wealth.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/register"
            class="px-6 py-3 bg-black text-white rounded-md font-semibold hover:bg-gray-800 transition-colors inline-block"
          >
            Get Started Free
          </NuxtLink>
          <button
            class="px-6 py-3 border border-gray-300 text-gray-900 rounded-md font-semibold hover:bg-gray-50 transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="bg-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900">Why Cashamole?</h2>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="text-center p-6">
            <div class="flex justify-center mb-4">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Shield class="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
            <p class="text-gray-600">
              Your data stays yours. No OAuth, no tracking, just pure control over your financial information.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="text-center p-6">
            <div class="flex justify-center mb-4">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Smartphone class="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Web & Desktop</h3>
            <p class="text-gray-600">
              Seamlessly switch between web and desktop. Your data syncs automatically, always in sync.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="text-center p-6">
            <div class="flex justify-center mb-4">
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp class="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Track & Grow</h3>
            <p class="text-gray-600">
              Monitor your net worth, transactions, and financial goals in one beautiful, intuitive dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="bg-black rounded-lg p-12 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">Ready to take control?</h2>
        <p class="text-gray-300 mb-8 text-lg">
          Join thousands of users managing their finances with Cashamole.
        </p>
        <NuxtLink
          to="/register"
          class="px-8 py-3 bg-white text-black rounded-md font-semibold hover:bg-gray-100 transition-colors inline-block"
        >
          Create Your Account
        </NuxtLink>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-600">
          <p>&copy; 2025 Cashamole. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

