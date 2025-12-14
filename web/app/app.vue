<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
import NavBar from '@/components/custom/shared/NavBar.vue';
import Footer from './components/custom/shared/Footer.vue';
import LeftSidebar from '@/components/custom/shared/LeftSidebar.vue';
// const config = useRuntimeConfig();
// const baseUrl = config.public.apiBaseUrl;
// console.log('main baseUrl: ', baseUrl);
// console.log('config: ', config);
import { useRoute } from '#app'; // Use the explicit import
const route = useRoute();

const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)

</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Toaster position="bottom-right" rich-colors />
    <NavBar />

    <div class="flex-1">
      <div class="flex flex-row">
        <div v-if="isLoggedIn" class="flex-0">
          <!-- <ClientOnly fallback-tag="div"> -->
            <LeftSidebar />
            <!-- <template #fallback>
              <div class="h-screen bg-gray-50 border-r flex-col w-36 p-1">-
                </div>
            </template>
          </ClientOnly> -->
        </div>
        <div class="flex-1">
          <Transition name="fade" mode="out-in">
            <div :key="route.fullPath || route.path || 'fallback-key'">
              <NuxtPage />
            </div>
          </Transition>
          <Footer />
        </div>

      </div>
    </div>
  </div>
</template>

<!-- <template>
  <div class="flex flex-col min-h-screen">
    <Toaster position="bottom-right" rich-colors />
    <NavBar />

    <div class="flex-1">
      <div class="flex flex-row">
        <div class="flex-0">
          <ClientOnly fallback-tag="div">
            <LeftSidebar />
            <template #fallback>
              <div class="h-screen bg-gray-50 border-r flex-col w-36 p-1">-
                </div>
            </template>
          </ClientOnly>
        </div>
        <div class="flex-1">
          <Transition name="fade" mode="out-in">
            <div :key="route.fullPath || route.path || 'fallback-key'">
              <NuxtPage />
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template> -->



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
