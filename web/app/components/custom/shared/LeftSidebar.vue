<script setup lang="ts">
import { ref } from 'vue';
import { ChevronsLeft, ChevronsRight, Home, Settings } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// State to track if the sidebar is expanded (300px) or collapsed (80px)
const isExpanded = ref(true);

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  
    <div
      :class="[
        'h-screen bg-gray-50 border-r transition-all duration-300 ease-in-out flex flex-col',
        isExpanded ? 'w-[9rem] p-1' : 'w-[3rem] p-1'
      ]"
    >
    <TooltipProvider>
      <div class="flex justify-end mb-8">
            <Button variant="ghost" size="icon" class="cursor-pointer" @click="toggleSidebar">
              <component :is="isExpanded ? ChevronsLeft : ChevronsRight" class="h-5 w-5" />
            </Button>

      </div>
  
      <nav class="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" class="justify-start cursor-pointer">
              <Home class="h-5 w-5 shrink-0" :class="isExpanded ? 'mr-3' : ''" />
              <span v-if="isExpanded" class="truncate">Dashboard</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Home</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" class="justify-start cursor-pointer">
              <Settings class="h-5 w-5 shrink-0" :class="isExpanded ? 'mr-3' : ''" />
              <span v-if="isExpanded" class="truncate">Settings</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
    </div>
</template>