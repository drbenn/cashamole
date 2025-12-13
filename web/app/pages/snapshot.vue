<script setup>
import { reactive, onMounted } from 'vue';
import { useSnapshotService } from '@/services/useSnapshotService'; // Adjust path as necessary

// 1. Define DTOs used by the service (assuming these are globally available or imported)
// NOTE: We assume SnapshotDto is the DTO required by the service's createSnapshot method.
// You will need to ensure this matches the backend's CreateSnapshotHeaderBodyDto.
// For the frontend, we use a simple structure matching the body payload.
const service = useSnapshotService();

// State management for the component
const dateState = reactive({
  date: null,
  loading: false,
  error: false,
  message: '',
  response: null,
});

// Set default date to today's date in YYYY-MM-DD format
const setInitialDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateState.date = `${yyyy}-${mm}-${dd}`;
};

onMounted(() => {
  setInitialDate();
});

const createSnapshot = async () => {
  if (!dateState.date) {
    dateState.message = 'Please select a date.';
    return;
  }
  
  // Reset state
  dateState.loading = true;
  dateState.error = false;
  dateState.message = '';
  dateState.response = null;

  try {
    // The <input type="date"> value is a YYYY-MM-DD string.
    // The backend handles conversion to a Date object.
    const payload = {
      snapshot_date: dateState.date,
    };
    
    // The useSnapshotService should handle the necessary Authorization headers (JWT) 
    // based on how your `useRuntimeConfig()` and `$fetch` are configured in Nuxt/Vue.
    const result = await service.createSnapshot(payload);

    if (result.success) {
      dateState.message = `Success! Snapshot created for ${result.data.snapshot_date}.`;
      dateState.response = result.data;
      dateState.error = false;
    } else {
      // Handle error cases using the structured ApiResponse
      dateState.error = true;
      dateState.message = `Error: ${result.error || 'An unknown error occurred.'}`;
      dateState.response = result.data;
      
      // Specifically check for conflict (409) if needed, though the message should capture it
      if (result.error && result.error.includes('A snapshot already exists')) {
          dateState.message = `Error: Snapshot for this date already exists.`;
      }
    }

  } catch (err) {
    // This catches issues outside of the structured API response (e.g., network failure)
    dateState.error = true;
    dateState.message = `Network/System Error: ${err.message}`;
    dateState.response = err;
  } finally {
    dateState.loading = false;
  }
};
</script>

<template>
  <div class="snapshot-creator">
    <h2>Create New Snapshot</h2>
    <div class="form-group">
      <label for="snapshotDate">Snapshot Date:</label>
      <input type="date" id="snapshotDate" v-model="dateState.date" required>
    </div>
    
    <button @click="createSnapshot" :disabled="!dateState.date || dateState.loading">
      {{ dateState.loading ? 'Creating...' : 'Create Snapshot Header' }}
    </button>

    <div v-if="dateState.message" :class="['feedback', dateState.error ? 'error' : 'success']">
      {{ dateState.message }}
    </div>
    
    <pre v-if="dateState.response">{{ JSON.stringify(dateState.response, null, 2) }}</pre>
  </div>
</template>

<style scoped>
/* Scoped styles remain the same for clarity and readability */
.snapshot-creator { max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
.form-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: bold; }
input[type="date"] { width: 100%; padding: 8px; box-sizing: border-box; }
button { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
button:disabled { background-color: #ccc; cursor: not-allowed; }
.feedback { margin-top: 15px; padding: 10px; border-radius: 4px; font-weight: bold; }
.success { background-color: #e6ffe6; border: 1px solid #00a000; color: #00a000; }
.error { background-color: #ffe6e6; border: 1px solid #a00000; color: #a00000; }
pre { background-color: #f4f4f4; padding: 10px; overflow-x: auto; font-size: 0.8em; }
</style>