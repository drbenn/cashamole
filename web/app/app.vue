<script setup lang="ts">
import NavBar from '@/components/custom/shared/NavBar.vue';
import SignInPage from '@/components/custom/pages/SignInPage.vue';
import RegisterPage from '@/components/custom/pages/RegisterPage.vue';

</script>

<template>
  <div>
    <!-- <NuxtRouteAnnouncer />
    <NuxtWelcome /> -->
    <SignInPage />
    <RegisterPage />
    <NavBar />
    <div class="text-cyan-700 font-black text-8xl">
      YO!!!
    </div>
    <div>
      <Button>Click me</Button>
    </div>
  </div>
</template>
