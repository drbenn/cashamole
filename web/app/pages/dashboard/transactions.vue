<script setup lang="ts">
import CategoryManager from '~/components/custom/CategoryManager.vue';

// import { Separator } from '@/components/ui/separator'

</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
    <!-- <div class="flex h-5 items-center space-x-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
    </div> -->

      <CategoryManager category-usage-type="transaction" />
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">User Transactions</h1>
      </div>

    </div>
  </div>
</template>