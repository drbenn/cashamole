<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils' // Assuming you have utility functions

// Shadcn-Vue component imports
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// 1. Define the List of Vendors
const vendors = [
  { value: 'amazon_services', label: 'Amazon Services' },
  { value: 'microsoft_corp', label: 'Microsoft Corporation' },
  { value: 'local_grocery', label: 'Local Grocery Store' },
  { value: 'gas_station', label: 'Gas Station' },
  { value: 'utility_company', label: 'Utility Company' },
  { value: 'software_a', label: 'Software Subscription A' },
]

// 2. State management
const open = ref(false)
const selectedValue = ref('') // Stores the selected 'value' (e.g., 'amazon_services')
const selectedLabel = computed(() => {
    // Find the label for the selected value to display in the button/input
    return vendors.find(v => v.value === selectedValue.value)?.label ?? 'Select Vendor...'
})

// 3. Handler to select an item
const selectVendor = (vendorValue: string) => {
    selectedValue.value = vendorValue
    open.value = false // Close the popover after selection
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-[300px] justify-between"
      >
        {{ selectedLabel }}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    
    <PopoverContent class="w-[300px] p-0">
      <Command>
        <CommandInput placeholder="Search or type new vendor..." />
        
        <CommandList>
          <CommandEmpty>No vendor found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="vendor in vendors"
              :key="vendor.value"
              :value="vendor.label" 
              @select="selectVendor(vendor.value)"
            >
              <Check
                :class="cn(
                  'mr-2 h-4 w-4',
                  selectedValue === vendor.value ? 'opacity-100' : 'opacity-0',
                )"
              />
              {{ vendor.label }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>

  <p class="mt-4 text-sm">Selected Value (to save in DB): <strong>{{ selectedValue }}</strong></p>
</template>