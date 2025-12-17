<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { Trash2 } from "lucide-vue-next"
import { fromDate, getLocalTimeZone, startOfMonth, endOfMonth, type DateValue, today } from '@internationalized/date' // Added type DateValue
import SuggestionInput from '~/components/custom/shared/SuggestionInput.vue';
import NotesIcon from '@/components/custom/shared/NotesIcon.vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { TransactionData, TransactionField } from '~/types/transaction.types';

// Define the transaction data (in a real app, this would be a prop from the main list)
const transaction= ref<TransactionData> ({
  id: '',
  type: '',
  date: '2025-12-01T05:00:00.000Z',
  category: 'Groceries',
  vendor: 'Blockbuster',
  amount: '55.99', // Stored as string for the SuggestionInput component
  note: 'This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!This is a note! BOOYAH!'
});

// Mock Options (You would fetch these from an API)
const categoryOptions = ref(['Groceries', 'Rent', 'Gas', 'Income', 'Salary']);
const vendorOptions = ref(['Amazon',  'Giant', 'Trader Joes'])


// State to track which field is currently in edit mode
const editingField = ref<TransactionField | null>(null);
// Template refs for focusing the correct input after V-IF renders it
const dateInputRef = ref<HTMLInputElement | null>(null);
const categoryInputRef = ref<SuggestionInputExposed | null>(null);
const vendorInputRef = ref<SuggestionInputExposed | null>(null);
const amountInputRef = ref<{ enterEditMode: () => void } | null>(null)

interface SuggestionInputExposed {
  focusInput: () => void;
  // If you expose the input ref itself, you could add:
  // inputRef: Ref<HTMLInputElement | null>; 
}

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
        console.log(`9. Saved ${fieldName}: ${transaction.value[key]}`);
    }
    
    // 2. Reset the state to show the static value
    editingField.value = null;
    
    // 3. Optional: Emit a 'transaction-updated' event to the main list component
  }, 100); 
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


/*************************************************************************************
 * DATE HELPERS
 */

const isCalendarOpen = ref(false)

// The Lower Bound to restrict to active month (Start of that specific month)
const monthStart = computed(() => {
  return startOfMonth(fromDate(transaction.value.date ? new Date(transaction.value.date) : new Date(), getLocalTimeZone()));
});

// The Upper Bound to restrict to active month (End of that specific month)
const monthEnd = computed(() => {
  return endOfMonth(fromDate(transaction.value.date ? new Date(transaction.value.date) : new Date(), getLocalTimeZone()));
});
// provides display of date via date form value (ISOstring)
const formattedDisplayDate = computed(() => {
  if (!transaction.value.date) return 'Date';
  
  const date = new Date(transaction.value.date);
  if (isNaN(date.getTime())) return 'Date';

  return date.toLocaleDateString('en-US', {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  })
});

const calendarValue = computed((): DateValue => {
  if (!transaction.value.date) {
    return today(getLocalTimeZone());
  }
  
  // Create a JS Date from the ISO string
  const jsDate = new Date(transaction.value.date);
  
  // If valid, convert to the Shadcn-compatible DateValue
  if (!isNaN(jsDate.getTime())) {
    return fromDate(jsDate, getLocalTimeZone());
  }
  
  return today(getLocalTimeZone());
});

/**
 * Helper function to format the DateValue object for display and storage.
 * We must use the DateValue's toDate() method.
 */
function formatDateForForm(dateValue: DateValue): string | null {
  if (!dateValue) return null;
  const formDateValue = dateValue.toDate(getLocalTimeZone()).toISOString()  
  return formDateValue
}

/**
 * Handles the event when the user selects a date from the calendar.
 * ⭐ Accepts the emitted DateValue from the Calendar component.
 */
function handleDateUpdate(dateValue: DateValue | undefined) {
  if (!dateValue) return;
  // 1. Update the transaction state with the formatted date string
  const isoDateStringForForm = formatDateForForm(dateValue)
  if (isoDateStringForForm) {
    transaction.value.date = isoDateStringForForm
  }
  // 2. Trigger the save logic (blur/save)
  handleSaveAndExit(); 
  // 3. Close the calendar popover
  isCalendarOpen.value = false;
}


/*************************************************************************************
 * AMOUNT HELPERS
 */

/**
 * ⭐ Input sanitizer
 * Prevents non-numeric characters from being typed or pasted.
 */
function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement;
  // Regex: Keep only digits and a single decimal point
  let value = input.value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point exists
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Update the transaction state
  transaction.value.amount = value;
}

/**
 * Helper function to format the amount for display.
 */
function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',     // currency if want $ sign before
    currency: 'USD',
  }).format(num);
}

/*************************************************************************************
 * NOTE HELPERS
 */

function updateNote(newNote: string) {
  transaction.value.note = newNote;
  // This is where you would dispatch an API call to save the note.
  console.log(`Note updated locally and ready for API save: ${newNote}`);
}
</script>


<template>
  <div class="transaction-row flex flex-nowrap items-center justify-between gap-0 p-1 border-b border-gray-200 hover:bg-gray-50 h-10 my-4 w-full">
    

    <div 
      class="w-[20%] min-w-[4.65rem] py-0 h-10 relative flex items-center box-border"
      @click="enterEditMode('date')"
    >
      <div class="w-full h-full flex items-center border-b border-transparent hover:bg-gray-100 hover:border-b hover:border-gray-400 box-border">
        <Popover v-model:open="isCalendarOpen">
          <PopoverTrigger as-child>
            <Button variant="ghost" class="h-10 min-w-[4.65rem] justify-between font-normal rounded-none px-2 cursor-pointer box-border">
              <!-- <CalendarIcon class="size-4 text-gray-500 hover:text-gray-700" /> -->
              {{ formattedDisplayDate }}
              
            </Button>
          </PopoverTrigger>
          
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar
              class="[&_svg]:hidden"
              :model-value="calendarValue"
              :min-value="monthStart"
              :max-value="monthEnd"
              @update:model-value="handleDateUpdate"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <div 
      class="w-[80%] min-w-[8rem] cursor-pointer py-0 h-10 box-border"
      @click="enterEditMode('category')"
    >
      <div v-if="editingField === 'category'" class="w-full">
        <SuggestionInput
          ref="categoryInputRef"
          v-model="transaction.category"
          :options="categoryOptions"
          placeholder="Category"
          
          class="w-full box-border" 
          @blur="handleSaveAndExit"
          @keydown.enter="handleSaveAndExit"
        />
      </div>
      <div
        v-else class="display-value w-full py-2 px-3 text-left box-border h-10
        text-base font-medium text-gray-500  
        hover:bg-gray-100 hover:border-b hover:border-gray-400">
        {{ transaction.category || 'Category' }}
      </div>
    </div>

    <div 
      class="w-[80%] min-w-[8rem] cursor-pointer py-0 h-10 box-border"
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
      <div
        v-else class="display-value w-full py-2 px-3 text-left box-border h-10
        text-base font-medium text-gray-500  
        hover:bg-gray-100 hover:border-b hover:border-gray-400">
        {{ transaction.vendor || 'Vendor' }}
      </div>
    </div>

    <div 
      class="w-[20%] min-w-[5rem] cursor-pointer h-10 box-border"
      @click="enterEditMode('amount')"
    >
      <div v-if="editingField === 'amount'" class="w-full h-full flex items-center border-b border-gray-400 bg-gray-50 box-border">
        <input
          ref="amountInputRef"
          v-model="transaction.amount"
          placeholder="0.00"
          class="w-full h-full text-center focus:outline-none bg-transparent p-0 box-border"
          inputmode="decimal"
          type="text" 
          @input="handleAmountInput"
          @blur="handleSaveAndExit"
          @keydown.enter="handleSaveAndExit"
        >
      </div>

      <div 
        v-else 
        class="w-full h-full flex items-center justify-center border-b border-transparent hover:bg-gray-100 hover:border-gray-400 box-border transition-colors">
        <span class="text-gray-900 font-light">
          {{ formatAmount(transaction.amount) }}
        </span>
      </div>
    </div>

    <div>
      <NotesIcon 
        :note-text="transaction.note"
        @update-note="updateNote"
      />
    </div>

    <div>
      <button 
        title="Deactivate Transaction"
        class="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer bg-transparent"
        @click="handleDeactivateClick"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
    
  </div>
</template>
