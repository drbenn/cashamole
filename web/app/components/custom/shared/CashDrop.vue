<script setup lang="ts">
import { ref } from 'vue'


// 1. Define Props (for v-model and the dynamic options list)
const props = defineProps<{
    /** The currently selected value (used for v-model) */
    value: string,
    /** The currently displayed label (used for v-model) */
    label: string,
    //  placeholder for input box
    placeholder?: string,
    /** The list of selectable options */
    options: {
        value: string; 
        label: string;
    }[],
}>()

// 2. Define Emits (for v-model)
const emit = defineEmits<{
  (e: 'update:value' | 'update:label', value: string): void
}>()


// Local State
const selectedValue = ref(props.value) // Tracks the ID
const inputDisplay = ref(props.label) // Text currently in the input
const isFocused = ref(false) // Controls visibility of the dropdown list

// 3. WATCHERS (CRITICAL FIX): Keep local state synced with parent changes
// If the parent updates the ID (e.g., from an API fetch), update the local state.
watch(() => props.value, (newId) => {
    selectedValue.value = newId;
});

// If the parent updates the Label, update the local input display.
watch(() => props.label, (newLabel) => {
    // Only update if the user isn't actively typing
    if (!isFocused.value) {
        inputDisplay.value = newLabel;
    }
});

// Computed property for simple case-insensitive filtering
const filteredOptions = computed(() => {
  if (!inputDisplay.value) {
    return props.options
  }
  const term = inputDisplay.value.toLowerCase()
  return props.options.filter(f => f.label.toLowerCase().includes(term))
})


function selectDropdownOption(option: { value: string, label: string }) {
  // Update local state
  selectedValue.value = option.value
  inputDisplay.value = option.label

  // 4. EMIT FIX: Emit the updates with the correct event names
  emit('update:value', option.value) 
  emit('update:label', option.label) 

  isFocused.value = false
}

// Handler for when the input loses focus
// Uses a delay to allow time for the click event on a list item to register
function handleBlur() {
    setTimeout(() => {
        isFocused.value = false
        
        // OPTIONAL: If the user searches and blurs, reset the input back to the selected label
        const selectedLabel = props.options.find(f => f.value === selectedValue.value)?.label
        if (selectedLabel) {
          inputDisplay.value = selectedLabel
        }
    }, 200) 
}

const inputRef = ref<HTMLInputElement | null>(null)
const moveCursorToEnd = () => {
  // We use nextTick to ensure the DOM is fully rendered before manipulation
  nextTick(() => {
      const inputElement = inputRef.value;
      if (inputElement) {
          // Calculate the length of the string
          const length = inputElement.value.length;
          
          // Set the cursor (caret) position to the end of the string
          inputElement.selectionStart = length;
          inputElement.selectionEnd = length;
      }
  });
};
</script>

<template>
  <div class="relative w-full max-w-[450px]">
    
    <input
      v-model="inputDisplay"
      type="text"
      :placeholder="props.placeholder"
      class="w-full h-10 px-3 py-5 text-md  focus:outline-none"
      @focus="isFocused = true"
      @blur="handleBlur"
      @click="moveCursorToEnd"
    >
    
    <div 
      v-if="isFocused"
      class="absolute z-50 top-full mt-0 w-full max-h-[300px] overflow-y-auto 
            bg-white border border-gray-300 rounded-sm shadow-lg"
    >
      <div v-if="options.length === 0" class="p-2 text-sm text-gray-500">
        No results found.
      </div>
      
      <button
        v-for="option in filteredOptions"
        :key="option.value"
        type="button"
        class="flex w-full items-center justify-between p-2 text-sm cursor-pointer 
              hover:bg-gray-100 transition-colors duration-150 text-left"
        @click="selectDropdownOption(option)"
      >
        <span>{{ option.label }}</span>
        
        <span 
          :class="['h-4 w-4 text-green-500', 
            selectedValue === option.value ? 'opacity-100' : 'opacity-0']"
        >
          ✓ 
        </span>
      </button>
    </div>
  </div>
</template>