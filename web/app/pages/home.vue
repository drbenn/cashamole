<script setup lang="ts">
import TransactionRow from '~/components/custom/TransactionRow.vue';

definePageMeta({
    middleware: ['auth'] // References middleware/auth.ts
  })
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <TransactionRow />
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">User Home</h1>
      </div>

    </div>
  </div>
</template>
