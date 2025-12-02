<script setup lang="ts">
import { ref } from 'vue'
import { Menu, X } from 'lucide-vue-next'

const isOpen = ref(false)

const navigation = [
  { name: 'Home', href: '#' },
  { name: 'Features', href: '#' },
  { name: 'Pricing', href: '#' },
  { name: 'About', href: '#' },
]
</script>

<template>
  <section class="relative w-full flex items-center bg-white py-8 md:py-16 lg:py-24">
    <div class="container mx-auto px-4 md:px-6 lg:px-8">
      <nav class="flex items-center justify-between">
        <div class="flex items-center">
          <span class="text-2xl font-bold">Logo</span>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <a
            v-for="item in navigation"
            :key="item.name"
            :href="item.href"
            class="text-gray-600 hover:text-gray-900"
          >
            {{ item.name }}
          </a>
          <Button>Sign In</Button>
        </div>

        <!-- Mobile Navigation Button -->
        <div class="md:hidden">
          <Button variant="ghost" @click="isOpen = !isOpen">
            <Menu v-if="!isOpen" class="h-6 w-6" />
            <X v-else class="h-6 w-6" />
          </Button>
        </div>
      </nav>

      <!-- Mobile Navigation Menu -->
      <div
        v-if="isOpen"
        class="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 py-4"
      >
        <div class="container mx-auto px-4">
          <div class="flex flex-col space-y-4">
            <a
              v-for="item in navigation"
              :key="item.name"
              :href="item.href"
              class="text-gray-600 hover:text-gray-900"
            >
              {{ item.name }}
            </a>
            <Button class="w-full">Sign In</Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>