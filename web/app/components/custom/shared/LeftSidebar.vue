<script setup lang="ts">
import { ref } from 'vue';
import { ChevronsLeft, ChevronsRight, Home, Settings, ListChecks, GalleryVertical } from 'lucide-vue-next';
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

const iconMap = {
  Home,
  ListChecks,
  GalleryVertical,
  Settings,
};

// // 1. Create a Union Type of all possible string literals: 'Home' | 'ListChecks' | ...
type IconKey = keyof typeof iconMap; // TypeScript now knows exactly what strings are valid

// // 2. Define the type for a single navigation item
interface NavItem {
  name: string;
  to: string;
  icon: IconKey; // <-- Use the specific union type here
  auth: string;
}

// // 3. Apply the type to your array
const allSideNavigation: NavItem[] = [
  { name: 'Home', to: '/dashboard', icon: 'Home', auth: 'loggedIn' },
  { name: 'Transactions', to: '/dashboard/transactions', icon: 'ListChecks', auth: 'loggedIn' },
  { name: 'Snapshots', to: '/dashboard/snapshots', icon: 'GalleryVertical', auth: 'loggedIn' },
  // { name: 'Settings', to: '/user/settings', icon: 'Settings', auth: 'loggedIn' },
];
</script>

<template>
  <div
    :class="[
      'h-screen bg-gray-50 border-r transition-all duration-300 ease-in-out flex flex-col',
      isExpanded ? 'w-[9rem] p-1' : 'w-[3rem] p-1'
    ]"
  >
    <!-- <TooltipProvider> -->
      <div class="flex justify-end mb-1">
        <Button variant="ghost" size="icon" class="cursor-pointer" @click="toggleSidebar">
          <component :is="isExpanded ? ChevronsLeft : ChevronsRight" class="h-5 w-5" />
        </Button>
      </div>
  
      <nav class="flex flex-col gap-0">
        <div v-for="item in allSideNavigation" :key="item.name">
          <!-- <Tooltip>
            <TooltipTrigger as-child> -->
              <NuxtLink v-slot="{ href, navigate }" :to="item.to" custom>
                <Button 
                  :href="href"
                  variant="ghost"
                  class="justify-start cursor-pointer w-full" 
                  @click="navigate"
                >
                  <component :is="iconMap[item.icon]" class="h-5 w-5 shrink-0" :class="isExpanded ? 'mr-3' : ''" />
                  <span v-if="isExpanded" class="truncate">{{ item.name }}</span>
                </Button>
              </NuxtLink>
            <!-- </TooltipTrigger>
          <TooltipContent :side="isExpanded ? 'top' : 'right'">
            {{ item.name }}
          </TooltipContent>
        </Tooltip> -->
  
        </div>
      </nav>
    <!-- </TooltipProvider> -->
  </div>
</template>