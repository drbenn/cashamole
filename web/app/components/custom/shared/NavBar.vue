<script setup lang="ts">
import { ref } from 'vue'
import { Box, Menu, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia';

const isOpen = ref(false)
const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)
const { logout } = useUserStore()

const allNavigation = [
  { name: 'Landing', to: '/', auth: 'always' },
  { name: 'Home', to: '/home', auth: 'loggedIn' },
  { name: 'Snapshot', to: '/snapshot', auth: 'loggedIn' },
  { name: 'Forgot Password', to: '/auth/request-password-reset', auth: 'loggedOut' },
  { name: 'Reset Password', to: '/auth/reset-password', auth: 'loggedOut' },
  { name: 'Verify Email', to: '/auth/verify-email', auth: 'loggedOut' },
  { name: 'Sign In', to: '/auth/sign-in', auth: 'loggedOut' },
  // { name: 'Sign Out', to: '/sign-in', auth: 'loggedIn' }, 
]

const filteredNavigation = computed(() => {
  return allNavigation.filter((item) => {
    if (item.auth === 'always' || !item.auth) {
      return true
    } else if (item.auth === 'loggedIn') {
      return isLoggedIn.value
    } else if (item.auth === 'loggedOut') {
      return !isLoggedIn.value
    } 
    return false
  })
})

const handleLogout = () => {
  logout()
}
</script>

<template>
  <section class="relative w-full flex items-center py-4 md:py-6 lg:py-10">
    <div class="container mx-auto px-4 md:px-6 lg:px-8">
      <nav class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <Box class="w-5 h-5 text-white" />
          </div>
          <span class="text-xl font-bold text-gray-900">Cashamole</span>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <NuxtLink
            v-for="item in filteredNavigation"
            :key="item.name"
            :to="item.to"
            class="text-gray-600 hover:text-gray-900"
          >
            {{ item.name }}
          </NuxtLink>
          <NuxtLink v-if="!isLoggedIn" to="/auth/register">
            <Button class="cursor-pointer">Sign Up</Button>
          </NuxtLink>
          <Button v-if="isLoggedIn" class="cursor-pointer" @click="handleLogout()">Sign Out</Button>
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
            <NuxtLink
              v-for="item in filteredNavigation"
              :key="item.name"
              :to="item.to"
              class="text-gray-600 hover:text-gray-900"
            >
              {{ item.name }}
            </NuxtLink>
            <NuxtLink v-if="!isLoggedIn" to="/auth/register">
              <Button class="cursor-pointer">Sign Up</Button>
            </NuxtLink>
            <Button v-if="isLoggedIn" class="cursor-pointer" @click="handleLogout()">Sign Out</Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>