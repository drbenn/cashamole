<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, markRaw } from 'vue';
import { NuxtLink } from '#components';

// --- STATE ---
const isExpanded = ref(true);
const activeTooltip = ref<string | null>(null);

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
  if (!isExpanded.value) {
    activeTooltip.value = null;
  }
};

// --- ICON & NAVIGATION DATA ---
// 1. Reactive map that will hold the icon components
const iconMap = ref<Record<string, any>>({}); 

// Define navigation items with their component names as strings
interface NavItem {
  name: string;
  to: string;
  icon: string; // Now a string name, not the imported component
  auth: string; 
}

const allSideNavigation: NavItem[] = [
  { name: 'Home', to: '/dashboard', icon: 'Home', auth: 'loggedIn' },
  { name: 'Transactions', to: '/dashboard/transactions', icon: 'ListChecks', auth: 'loggedIn' },
  { name: 'Snapshots', to: '/dashboard/snapshots', icon: 'GalleryVertical', auth: 'loggedIn' },
  { name: 'Settings', to: '/user/settings', icon: 'Settings', auth: 'loggedIn' },
];


// 2. Load the Icons ONLY on the Client
onMounted(async () => {
  // Map of icon names to their dynamic imports
  const iconImports = {
    Home: () => import('lucide-vue-next').then(m => m.Home),
    ListChecks: () => import('lucide-vue-next').then(m => m.ListChecks),
    GalleryVertical: () => import('lucide-vue-next').then(m => m.GalleryVertical),
    Settings: () => import('lucide-vue-next').then(m => m.Settings),
    ChevronsLeft: () => import('lucide-vue-next').then(m => m.ChevronsLeft),
    ChevronsRight: () => import('lucide-vue-next').then(m => m.ChevronsRight),
  };
  
  // Asynchronously load all icons
  const icons = await Promise.all(
      Object.entries(iconImports).map(([name, importer]) => importer().then(comp => ({ name, comp })))
  );
  
  // Populate the reactive map with the loaded components
  iconMap.value = icons.reduce((acc, { name, comp }) => {
    acc[name] = markRaw(comp);
    return acc;
  }, {});
});


// --- CUSTOM TAILWIND CLASSES ---
const baseButtonClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors cursor-pointer w-full text-gray-700 hover:bg-gray-200";
const iconSizeClasses = "h-9 w-9 p-0";
const fullSizeClasses = "h-10 px-3 py-2";

// --- CUSTOM TOOLTIP LOGIC ---
const showTooltip = (name: string) => {
  if (!isExpanded.value) {
    activeTooltip.value = name;
  }
};
const hideTooltip = () => {
  activeTooltip.value = null;
};

</script>

<template>
  <div
    :class="[
      'h-screen bg-gray-50 border-r transition-all duration-300 ease-in-out flex flex-col',
      isExpanded ? 'w-[9rem] p-1' : 'w-[3rem] p-1'
    ]"
    suppressHydrationWarning="true"
  >
    <div class="flex justify-end mb-1">
      <button 
        :class="[baseButtonClasses, iconSizeClasses]" 
        @click="toggleSidebar"
        aria-label="Toggle Sidebar"
        :disabled="!iconMap.ChevronsLeft"
      >
        <component 
          v-if="iconMap.ChevronsLeft"
          :is="isExpanded ? iconMap.ChevronsLeft : iconMap.ChevronsRight" 
          class="h-5 w-5" 
        />
      </button>
    </div>
  
    <nav class="flex flex-col gap-0">
      <div 
        v-for="item in allSideNavigation" 
        :key="item.name" 
        class="relative"
        @mouseenter="showTooltip(item.name)"
        @mouseleave="hideTooltip"
      >
        <NuxtLink v-slot="{ href, navigate }" :to="item.to" custom>
          <a 
            :href="href"
            :class="[baseButtonClasses, fullSizeClasses, 'justify-start']" 
            @click="navigate"
          >
            <component 
              v-if="iconMap[item.icon]"
              :is="iconMap[item.icon]" 
              class="h-5 w-5 shrink-0" 
              :class="isExpanded ? 'mr-3' : 'mx-auto'" 
            />
            <span v-if="isExpanded" class="truncate">{{ item.name }}</span>
          </a>
        </NuxtLink>

        <Transition name="fade-tooltip">
          <div 
            v-if="!isExpanded && activeTooltip === item.name"
            class="absolute left-full top-1/2 z-50 -translate-y-1/2 ml-2 whitespace-nowrap"
          >
            <div class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
              {{ item.name }}
            </div>
          </div>
        </Transition>
      </div>
    </nav>
  </div>
</template>

<style>
/* ... (Tooltip styles from previous response) ... */
.fade-tooltip-enter-active,
.fade-tooltip-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-tooltip-enter-from,
.fade-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-5px) translateY(-50%);
}
</style>