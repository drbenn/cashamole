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
      <NuxtPage />
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>
