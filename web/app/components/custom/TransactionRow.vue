<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { Trash2, CalendarIcon } from "lucide-vue-next"
import { fromDate, getLocalTimeZone, type DateValue, today } from '@internationalized/date' // Added type DateValue
import SuggestionInput from '~/components/custom/shared/SuggestionInput.vue';
import NotesIcon from '@/components/custom/shared/NotesIcon.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'


function formatDate(date: Date | undefined) {
  if (!date || isNaN(date.getTime())) { // Check if date is undefined or invalid
    return '';
  }
  // Format for display when not editing
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// --- State and Data ---
interface TransactionData {
  id: string;           // Added ID for API calls on update
  type: 'income' | 'expense' | ''
  date: string
  category: string;
  vendor: string;
  amount: string;
  note: string;
}
// Define the transaction data (in a real app, this would be a prop from the main list)
const transaction= ref<TransactionData> ({
  id: '',
  type: '',
  date: '',
  category: 'Groceries',
  vendor: 'Blockbuster',
  amount: '55.99', // Stored as string for the SuggestionInput component
  note: 'This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!'
});

// Date items
// const nativeDate = computed(() => {
//   return new Date(transaction.value.date);
// })
const isCalendarOpen = ref(false)

// State to track which field is currently in edit mode
type TransactionField = 'date' | 'category' | 'vendor' | 'amount';
const editingField = ref<TransactionField | null>(null);

interface SuggestionInputExposed {
  focusInput: () => void;
  // If you expose the input ref itself, you could add:
  // inputRef: Ref<HTMLInputElement | null>; 
}
// Template refs for focusing the correct input after V-IF renders it
const dateInputRef = ref<HTMLInputElement | null>(null);
const categoryInputRef = ref<SuggestionInputExposed | null>(null);
const vendorInputRef = ref<SuggestionInputExposed | null>(null);
const amountInputRef = ref<{ enterEditMode: () => void } | null>(null)


// Mock Options (You would fetch these from an API)
const categoryOptions = ref(['Groceries', 'Rent', 'Gas', 'Income', 'Salary']);
const vendorOptions = ref(['Amazon',  'Giant', 'Trader Joes'])

// const amountOptions = ref(['100.00', '25.00', '50.00']); // Just for demonstration


// --- Methods ---

/**
 * Handles the click on the display value to enter edit mode.
 * @param field - The name of the field to edit ('category' or 'amount').
 */
function enterEditMode(field: TransactionField) {
  // 1. Set the state to show the input for the clicked field
  editingField.value = field;
  
  // 2. Wait for the component to render (V-IF becomes true) and then focus the input.
  nextTick(() => {
    // Note: The focus logic is now primarily handled by a public method 
    // we'll define on the SuggestionInput component in the next step.
    if (field === 'category' && categoryInputRef.value) {
      // Assuming SuggestionInput has an exposed method called 'focusInput'
      categoryInputRef.value.focusInput(); 
    } else if (field === 'vendor' && vendorInputRef.value) {
      vendorInputRef.value.focusInput();
    }
    else if (field === 'amount' && amountInputRef.value) {
      amountInputRef.value.enterEditMode()
    }
    else if (field === 'date') {
      editingField.value = field;
      nextTick(() => {
        if (dateInputRef.value) {
          dateInputRef.value.focus(); 
          dateInputRef.value.select();
        }
      });
    }
  });
}


/**
 * Handles the event when the user selects a date from the calendar.
 * ⭐ FIX: Accepts the emitted DateValue | undefined from the Calendar component.
 */
function handleCalendarUpdate(dateValue: DateValue | undefined) {
  if (!dateValue) return;

  // 1. Convert the custom DateValue object back to a standard JS Date object
  const selectedDate = dateValue.toDate(getLocalTimeZone());

  // 2. Update the transaction state with the formatted date string
  transaction.value.date = formatDate(selectedDate);
  
  // 3. Trigger the save logic (blur/save)
  handleSaveAndExit(); 

  // 4. Close the calendar popover
  isCalendarOpen.value = false;
}

// The Calendar requires a DateValue object. We use a computed property 
// that converts the transaction string to DateValue or defaults to today().
const calendarValue = computed(() => {
    const dateStr = transaction.value.date;
    const date = new Date(dateStr);
    
    // If the string is a valid date, convert it. Otherwise, use today's date.
    if (dateStr && !isNaN(date.getTime())) {
        return fromDate(date, getLocalTimeZone());
    }
    return today(getLocalTimeZone());
});

/**
 * Helper function to format the DateValue object for display and storage.
 * We must use the DateValue's toDate() method.
 */
function formatDateForDisplay(dateValue: DateValue): string {
  if (!dateValue) return 'Select date';
  
  return dateValue.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}


/**
 * Handles the event when the user selects a date from the calendar.
 * ⭐ Accepts the emitted DateValue from the Calendar component.
 */
function handleDateUpdate(dateValue: DateValue | undefined) {
  if (!dateValue) return;

  // 1. Update the transaction state with the formatted date string
  transaction.value.date = formatDateForDisplay(dateValue);
  
  // 2. Trigger the save logic (blur/save)
  handleSaveAndExit(); 

  // 3. Close the calendar popover
  isCalendarOpen.value = false;
}

/**
 * Handles both the blur (clicking away) and Enter key press to exit edit mode.
 */
function handleSaveAndExit() {
  // CRITICAL FIX for BLUR: Use a timeout to allow the click on the dropdown 
  // options (in SuggestionInput) to register before exiting edit mode.
  setTimeout(() => {
    const fieldName = editingField.value;

    // 1. Save logic (In a real app, you would dispatch an API call here)
    // Check that we are definitely in an editing state
    if (fieldName) {
        // Option 1: Use bracket notation with 'as keyof typeof transaction.value'
        // This tells TypeScript: "fieldName is a valid key of the transaction object."
        const key = fieldName as keyof typeof transaction.value; 
        
        console.log(`Saved ${fieldName}: ${transaction.value[key]}`);
    }
    
    // 2. Reset the state to show the static value
    editingField.value = null;
    
    // 3. Optional: Emit a 'transaction-updated' event to the main list component
  }, 100); 
}

/**
 * Helper function to format the amount for display.
 */
function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

async function handleDeactivateClick() {
  // 1. Trigger the confirmation prompt
  const isConfirmed = window.confirm(
    "Are you sure you want to deactivate this transaction? This action cannot be undone."
  );

  if (isConfirmed) {
    // 2. User confirmed, proceed with API call
    try {
      // Set a loading state if you have one
      // isLoading.value = true; 
      
      // await apiDeactivateTransaction(transactionId);
      
      console.log('Transaction deactivated successfully!');
      
      // 3. Emit event to parent to remove the row from the list
      // emit('transaction-deleted', transactionId); 
      
    } catch (error) {
      console.error("Failed to deactivate transaction:", error);
      // Display a user-friendly error notification
    } 
    // finally {
    //   isLoading.value = false;
    // }
  } else {
    console.log('Deactivation cancelled by user.');
  }
}

function updateNote(newNote: string) {
  transaction.value.note = newNote;
  // This is where you would dispatch an API call to save the note.
  console.log(`Note updated locally and ready for API save: ${newNote}`);
}
</script>


<template>
  <div class="transaction-row flex flex-nowrap items-center justify-between gap-4 p-1 border-b border-gray-200 hover:bg-gray-50 h-10 my-4">
    

<div 
      class="w-[20%] min-w-[6rem] py-0 h-10 px-3 relative flex items-center"
    >
      <Popover v-model:open="isCalendarOpen">
        <PopoverTrigger as-child>
          <Button
            id="date-picker"
            variant="outline"
            class="w-full justify-between font-normal h-8"
          >
            {{ transaction.date || formatDateForDisplay(calendarValue) || "Select date" }}
            <ChevronDownIcon class="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto overflow-hidden p-0" align="start">
          <Calendar
            :model-value="calendarValue"
            @update:model-value="handleDateUpdate"
          />
        </PopoverContent>
      </Popover>
    </div>

    <div 
      class="w-[80%] min-w-[8rem] cursor-pointer py-0 h-10"
      @click="enterEditMode('category')"
    >
      <div v-if="editingField === 'category'" class="w-full">
        <SuggestionInput
          ref="categoryInputRef"
          v-model="transaction.category"
          :options="categoryOptions"
          placeholder="Category"
          
          class="w-full" 
          @blur="handleSaveAndExit"
          @keydown.enter="handleSaveAndExit"
        />
      </div>
      <div v-else class="display-value w-full text-base font-medium text-gray-800 py-2 px-3">
        {{ transaction.category || 'Category' }}
      </div>
    </div>

    <div 
      class="w-[80%] min-w-[8rem] cursor-pointer py-0 h-10"
      @click="enterEditMode('vendor')"
    >
      <div v-if="editingField === 'vendor'" class="w-full">
        <SuggestionInput
          ref="vendorInputRef"
          v-model="transaction.vendor"
          :options="vendorOptions"
          placeholder="Vendor"
          
          class="w-full" 
          @blur="handleSaveAndExit"
          @keydown.enter="handleSaveAndExit"
        />
      </div>
      <div v-else class="display-value w-full text-base font-medium text-gray-800 py-2 px-3">
        {{ transaction.vendor || 'Vendor' }}
      </div>
    </div>

    <div 
      class="w-[20%] min-w-[5rem] cursor-pointer py-2 text-right"
      @click="enterEditMode('amount')"
    >
      <div v-if="editingField === 'amount'" class="w-ful text-gray-900 font-light">
        <input
          ref="amountInputRef"
          v-model="transaction.amount"
          placeholder="0.00"
          class="w-full text-center focus:outline-none border-b border-blue-500"
          inputmode="decimal" 
          type="text"
                  pattern="[0-9]*[.,]?[0-9]*"
        @blur="handleSaveAndExit"
        @keydown.enter="handleSaveAndExit"

        >
      </div>
      <div v-else class="display-value text-gray-900 font-light text-center">
        {{ formatAmount(transaction.amount) || '0.00' }}
      </div>
    </div>

    <NotesIcon 
      :note-text="transaction.note"
      @update-note="updateNote"
    />

    <button 
        title="Deactivate Transaction"
        class="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
        @click="handleDeactivateClick"
      >
        <Trash2 class="w-4 h-4" />
    </button>
    
  </div>
</template>