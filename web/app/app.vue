<script setup lang="ts">
import NavBar from '@/components/custom/shared/NavBar.vue';
import Footer from './components/custom/shared/Footer.vue';
</script>

<template>
  <div class="flex flex-col min-h-screen">
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
