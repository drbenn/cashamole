<script setup lang="ts">
const route = useRoute();
const email = route.query.email || ''
const created_at = route.query.created_at as string || ''

const confirmationDeadline = ref('');

if (created_at) {
    // 2. Convert the ISO String into a Date object
    // JavaScript's Date constructor handles ISO strings (like "2025-12-08T14:03:19.477Z")
    // and converts them into the user's local time based on their device settings.
    const creationDate = new Date(created_at);

    // 3. Add 60 minutes (60 * 60 * 1000 milliseconds) to the timestamp.
    // We use getTime() to get the milliseconds since epoch, add the duration,
    // and then set the new time back into the Date object.
    const deadlineTimestamp = creationDate.getTime() + (60 * 60 * 1000);
    const deadlineDate = new Date(deadlineTimestamp);

    // 4. Format the time for the user's local time zone and language
    // We use Intl.DateTimeFormat for a robust, user-friendly, locale-aware output.
    confirmationDeadline.value = deadlineDate.toLocaleTimeString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short', // Shows "EST", "PST", "GMT", etc.
    });

    // Alternatively, for a shorter format:
    /*
    confirmationDeadline.value = deadlineDate.toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
    */
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">Account Created</h1>
      </div>

      <div class="text-center text-lg text-gray-900 cursor-default mb-8">
        <p class="">
          Your account has been created successfully!
        </p>
        <p class="mt-6">
          Please check your {{ email }} email to confirm your account
          <span v-if="confirmationDeadline"> before {{ confirmationDeadline }}.</span>
        </p>
      </div>

    </div>
  </div>
</template>
