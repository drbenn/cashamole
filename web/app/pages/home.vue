<script setup lang="ts">
  const { isLoggedIn } = useUserStore()

  if (!isLoggedIn) {
    navigateTo({
      path: '/auth/sign-in',
    })
  }
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">User Home</h1>
      </div>

    </div>
  </div>
</template>
