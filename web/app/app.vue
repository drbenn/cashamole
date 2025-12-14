<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
import NavBar from '@/components/custom/shared/NavBar.vue';
import Footer from './components/custom/shared/Footer.vue';
const config = useRuntimeConfig();
const baseUrl = config.public.apiBaseUrl;
console.log('main baseUrl: ', baseUrl);
console.log('config: ', config);

</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Toaster position="bottom-right" rich-colors />
    <!-- Navbar -->
    <NavBar />

    <!-- Page Content (grows to fill space) -->
    <main class="flex-1">
      <Transition name="fade" mode="out-in">
        <NuxtPage />
      </Transition>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.075s ease;
}

.fade-enter-from {
  opacity: 0.1;
}

.fade-leave-to {
  opacity: 0.1;
}
</style>
