<script setup lang="ts">
import LeftSidebarContent from './LeftSidebarContent.vue';
</script>

<template>
  <ClientOnly fallback-tag="div">
    
    <LeftSidebarContent />
    
    <template #fallback>
      <div class="h-screen bg-gray-50 border-r flex-col w-[9rem] p-1" />
    </template>

  </ClientOnly>
</template>