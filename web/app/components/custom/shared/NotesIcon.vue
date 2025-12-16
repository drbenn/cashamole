<script setup lang="ts">
import { ref, watch } from 'vue'
import { FileText, X } from 'lucide-vue-next'

// --- Shadcn Component Imports (Assume these paths are correct for your project) ---
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose 
} from '@/components/ui/dialog'
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip'

// 1. Define the type for the function that will be debounced (the original function)
type AnyFunction = (...args: any[]) => any;

// 2. Define the Interface for the Debounced Function
// It extends the original function's signature but adds the .flush() method.
interface DebouncedFunction<T extends AnyFunction> {
    (...args: Parameters<T>): void; // The debounced function returns void
    flush?: () => void;
}

// --- The Debounce Utility (Updated) ---
const debounce = <T extends AnyFunction>(func: T, delay: number): DebouncedFunction<T> => {
    let timeoutId: number;
    
    // The inner function signature now matches the original function's parameters
    const debounced = (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        // We use a type assertion here because setTimeout returns a number (NodeJS) or a browser ID
        timeoutId = setTimeout(() => func(...args), delay) as unknown as number; 
    };
    
    // Attach a flush method
    (debounced as DebouncedFunction<T>).flush = () => {
        clearTimeout(timeoutId);
        // In this specific implementation, we rely on the watch() logic calling the 
        // triggerNoteUpdate(localNote.value) outside of the debounce to handle the save.
    };
    
    return debounced as DebouncedFunction<T>;
};


// --- Props and Emits ---

const props = defineProps<{
  noteText: string;
}>();

const emit = defineEmits<{
  (e: 'update-note', note: string): void;
}>();


// --- State ---

const isDialogOpen = ref(false);
const localNote = ref(props.noteText);


// --- Debounced Autosave Implementation ---

const triggerNoteUpdate = (newNote: string) => {
  if (newNote !== props.noteText) {
    // CRITICAL: Ensure we emit the *current* value of the Textarea, which is localNote.value
    // Since this function is only called when typing stops, it's safe to use the latest ref value.
    emit('update-note', newNote);
    console.log(`Autosaved note update emitted: ${newNote.substring(0, 30)}...`);
  }
};

// Debounce the update function (e.g., save after typing stops for 500ms)
const debouncedUpdate = debounce(triggerNoteUpdate, 500);


// Watch the local input value and trigger the debounce function
watch(localNote, (newVal) => {
    debouncedUpdate(newVal);
});


// --- Dialog Handlers ---

function openDialog() {
  localNote.value = props.noteText; 
  isDialogOpen.value = true;
}

function closeDialog() {
  // CRITICAL: Type-safe call to flush()
  // We first call flush() to ensure any pending save is executed immediately.
  if (debouncedUpdate.flush) {
      // Because our simple debounce doesn't track arguments, we call the trigger 
      // function directly with the current state before closing.
      triggerNoteUpdate(localNote.value);
      debouncedUpdate.flush(); 
  }
  
  isDialogOpen.value = false;
}

// Sync the internal state when the parent prop changes externally
watch(() => props.noteText, (newVal) => {
  localNote.value = newVal;
});
</script>

<template>
  <div class="flex items-center">
    
    <TooltipProvider>
      <Tooltip :delay-duration="150">
        
        <TooltipTrigger as-child>
          <Button 
            variant="ghost" 
            size="icon" 
            class="transition-colors rounded-full cursor-pointer"
            :class="noteText ? 'text-blue-600 hover:bg-blue-100/50' : 'text-gray-400 hover:bg-gray-100'"
            @click="openDialog"
          >
            <FileText class="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        
        <TooltipContent v-if="noteText">
          <p class="max-w-xs wrap-break-word whitespace-normal text-sm">
            {{ noteText }}
          </p>
        </TooltipContent>
        
      </Tooltip>
    </TooltipProvider>

    <Dialog :open="isDialogOpen" @update:open="closeDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction Note</DialogTitle>
          <!-- <DialogClose as-child>
            <Button 
                variant="ghost" 
                size="sm" 
                class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                @click="closeDialog"
            >
                <X class="h-4 w-4" />
            </Button>
          </DialogClose> -->
        </DialogHeader>
        
        <div class="grid gap-4 py-4">
          <Textarea 
            id="note-input"
            v-model="localNote" 
            placeholder="Add a detailed note about this transaction..."
            rows="5"
            class="col-span-4 h-32 w-full resize-none overflow-y-auto"
          />
        </div>
        
        </DialogContent>
    </Dialog>
    
  </div>
</template>
