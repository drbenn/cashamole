<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { X } from 'lucide-vue-next' // 1

// 1. Template ref for cursor control
const inputRef = ref<HTMLInputElement | null>(null)

// 1. Define Props (SIMPLIFIED: Single modelValue, options is string[])
const props = defineProps<{
    /** The final text in the input (bound via v-model) */
    modelValue: string, // Changed from 'value' back to 'modelValue' for standard v-model
    //  placeholder for input box
    placeholder?: string,
    /** The list of selectable options (NOW ARRAY OF STRINGS) */
    options: string[],
}>()

// 2. Define Emits (SIMPLIFIED: Single update:modelValue)
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()


// --- Local State ---
// Local ref for the input box, initialized from the prop
const inputDisplay = ref(props.modelValue) 
const isFocused = ref(false)

// 3. Watchers (SIMPLIFIED: Only watch modelValue for external updates)
watch(() => props.modelValue, (newText) => {
    // Only update if the user isn't actively typing
    if (!isFocused.value) {
        inputDisplay.value = newText;
    }
});

// Watch local typing and emit change immediately
watch(inputDisplay, (newText) => {
    emit('update:modelValue', newText)
});


// 4. Computed property for filtering (FIXED: Filter on array elements directly)
const filteredOptions = computed(() => {
  if (!inputDisplay.value) {
    return props.options
  }
  const term = inputDisplay.value.toLowerCase()
  // Filter on the string element (f) itself
  return props.options.filter(suggestion => suggestion.toLowerCase().includes(term))
})


function selectDropdownOption(suggestion: string) { // FIXED: Takes a string argument
  // 5. Update the input display with the selected string
  inputDisplay.value = suggestion

  // The v-model watch handler (above) automatically emits the update
  
  // Hide the list
  isFocused.value = false
}

// Handler for when the input loses focus (simplified)
function handleBlur() {
    setTimeout(() => {
        isFocused.value = false
        // Since the v-model updates on every keystroke, the current value is already the final value.
    }, 200) 
}

const moveCursorToEnd = () => {
  // Logic remains the same
  nextTick(() => {
      const inputElement = inputRef.value;
      if (inputElement) {
          const length = inputElement.value.length;
          inputElement.selectionStart = length;
          inputElement.selectionEnd = length;
      }
  });
};

// New function to handle the Enter key press
function handleEnter() {
  // 1. Hide the suggestions dropdown
  isFocused.value = false;
  
  // 2. Since v-model is already bound to inputDisplay, 
  // the final value is already emitted back to the parent.
}

function clearInput() {
  // 2. Set the input text to an empty string
  inputDisplay.value = '';
  
  // 3. Optional: Re-focus the input after clearing
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      isFocused.value = true; // Ensure dropdown stays open if they want to type
    }
  });
}

// exposes input to parent to allow google sheets like "Inline Editing" or "Render-as-Value, Edit-on-Click"
const focusInput = () => {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      // Also ensure the dropdown shows after programmatic focus
      isFocused.value = true; 
    }
  });
};

defineExpose({
  focusInput,
});
</script>

<template>
  <div class="relative w-full max-w-[450px] box-border">
    <div class="relative">
      <input
        ref="inputRef"
        
        v-model="inputDisplay"
        type="text"
        :placeholder="props.placeholder"
        class="w-full h-10 px-3 py-5 text-md focus:outline-none box-border"
        @focus="isFocused = true; moveCursorToEnd();"
        @blur="handleBlur"
        @click="moveCursorToEnd"
        @keydown.enter="handleEnter"
      >
      <button
          v-if="inputDisplay.length > 0"
          type="button"
          class="absolute inset-y-0 right-0 flex items-center justify-center box-border
                w-10 h-full text-gray-500 hover:text-gray-700 transition-colors cursor-pointer" 
          
          @click.prevent="clearInput"
        >
          <X class="w-4 h-4" />
        </button>
    </div>
    
    <div 
      v-if="isFocused"
      class="absolute z-50 top-full mt-[4px] w-full max-h-[300px] overflow-y-auto 
            bg-white border border-gray-300 rounded-sm shadow-lg box-border"
    >
      <div v-if="filteredOptions.length === 0" class="p-2 text-sm text-gray-500 box-border">
        No results found.
      </div>
      
      <button
        v-for="suggestion in filteredOptions"
        :key="suggestion" type="button"
        class="flex w-full items-center justify-between p-2 text-sm cursor-pointer box-border
              hover:bg-gray-100 transition-colors duration-150 text-left"
        @click="selectDropdownOption(suggestion)" >
        <span>{{ suggestion }}</span> </button>
    </div>
  </div>
</template>