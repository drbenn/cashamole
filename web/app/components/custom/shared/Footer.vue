<script setup lang="ts">
import { ref } from 'vue'
import {
  Box,
  Check,
  ArrowRight,
  Loader2,
  Twitter,
  Instagram,
  Github,
  Linkedin,
} from 'lucide-vue-next'

const newsletterEmail = ref('')
const isSubscribing = ref(false)

const handleSubscribe = async () => {
  if (!newsletterEmail.value) {
    console.error('Email is required')
    return
  }

  isSubscribing.value = true

  try {
    // TODO: Call backend newsletter subscription endpoint
    // const response = await $fetch('/api/newsletter/subscribe', {
    //   method: 'POST',
    //   body: {
    //     email: newsletterEmail.value,
    //   },
    // })

    console.log('Newsletter subscription:', newsletterEmail.value)
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Subscribed successfully!')
    newsletterEmail.value = ''
  } catch (error) {
    console.error('Subscription error:', error)
  } finally {
    isSubscribing.value = false
  }
}
</script>


<template>
  <footer class="bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <!-- Main Footer Content -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Brand Section -->
        <div class="md:col-span-1">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Box class="w-5 h-5 text-gray-900" />
            </div>
            <span class="text-lg font-bold text-gray-900">Brand</span>
          </div>
          <p class="text-gray-600 text-sm leading-relaxed mb-6">
            Making the world a better place through constructing elegant hierarchies.
          </p>

          <!-- Features List -->
          <div class="space-y-2">
            <h4 class="font-semibold text-gray-900 mb-4">Everything you need</h4>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-gray-600 text-sm">
                <Check class="w-4 h-4 text-gray-400" />
                <span>Free updates</span>
              </li>
              <li class="flex items-center gap-2 text-gray-600 text-sm">
                <Check class="w-4 h-4 text-gray-400" />
                <span>Premium support</span>
              </li>
              <li class="flex items-center gap-2 text-gray-600 text-sm">
                <Check class="w-4 h-4 text-gray-400" />
                <span>Community access</span>
              </li>
              <li class="flex items-center gap-2 text-gray-600 text-sm">
                <Check class="w-4 h-4 text-gray-400" />
                <span>Private projects</span>
              </li>
            </ul>
          </div>

          <!-- Newsletter -->
          <div class="mt-8">
            <h4 class="font-semibold text-gray-900 mb-4">Subscribe to our newsletter</h4>
            <form class="flex" @submit.prevent="handleSubscribe">
              <input
                v-model="newsletterEmail"
                type="email"
                placeholder="Enter your email"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900 placeholder-gray-500 text-sm"
                required
              >
              <button
                type="submit"
                :disabled="isSubscribing"
                class="px-4 py-2 bg-black text-white rounded-r-md hover:bg-gray-800 transition-colors disabled:opacity-50 font-semibold text-sm flex items-center gap-2"
              >
                <span v-if="!isSubscribing">Subscribe</span>
                <span v-else class="flex items-center gap-1">
                  <Loader2 class="w-4 h-4 animate-spin" />
                </span>
                <ArrowRight class="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <!-- Company Column -->
        <div>
          <h3 class="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-6">
            Company
          </h3>
          <ul class="space-y-3">
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                About us
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Our team
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Careers
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Contact
              </a>
            </li>
          </ul>
        </div>

        <!-- Resources Column -->
        <div>
          <h3 class="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-6">
            Resources
          </h3>
          <ul class="space-y-3">
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                API Reference
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Status
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal Column -->
        <div>
          <h3 class="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-6">
            Legal
          </h3>
          <ul class="space-y-3">
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Privacy
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Terms
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                License
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Security
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Footer -->
      <div class="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-gray-600 text-sm">
          2025 Your Company. All rights reserved.
        </p>

        <!-- Social Links -->
        <div class="flex items-center gap-4">
          <a
            href="#"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            title="Twitter"
          >
            <Twitter class="w-5 h-5" />
          </a>
          <a
            href="#"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            title="Instagram"
          >
            <Instagram class="w-5 h-5" />
          </a>
          <a
            href="#"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            title="GitHub"
          >
            <Github class="w-5 h-5" />
          </a>
          <a
            href="#"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            title="LinkedIn"
          >
            <Linkedin class="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
