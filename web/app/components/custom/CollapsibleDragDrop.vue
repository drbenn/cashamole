<script setup lang="ts">
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { GripVertical, ChevronDown } from 'lucide-vue-next'

interface Transaction {
  id: string
  name: string
  amount: number
}

interface Category {
  id: string
  title: string
  isOpen: boolean
  transactions: Transaction[]
}

const categories = ref<Category[]>([
  { 
    id: 'cat-1', title: 'Groceries', isOpen: true, 
    transactions: [
      { id: 't-1', name: 'Whole Foods', amount: 50.00 },
      { id: 't-2', name: 'Trader Joes', amount: 35.00 }
    ] 
  },
  { 
    id: 'cat-2', title: 'Transportation', isOpen: false, 
    transactions: [
      { id: 't-3', name: 'Uber', amount: 15.00 },
      { id: 't-4', name: 'Gas Station', amount: 45.00 }
    ] 
  }
])

// API Update Handlers
const onCategoryReorder = () => {
  const newOrder = categories.value.map(c => c.id)
  console.log('Save Category Order to API:', newOrder)
}

const onTransactionMove = (e: Event) => {
  console.log('Transaction moved!')
  console.log(e);
  
  // In a real app, you'd send the new state of categories.value to your DB
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6 space-y-8">
    
    <VueDraggable
      v-model="categories"
      handle=".category-handle"
      :animation="200"
      class="space-y-4"
      @end="onCategoryReorder"
    >
      <div v-for="category in categories" :key="category.id" class="border rounded-xl bg-white shadow-sm overflow-hidden">
        
        <div class="flex items-center justify-between p-4 bg-slate-50 border-b">
          <div class="flex items-center gap-3">
            <div class="category-handle cursor-grab active:cursor-grabbing text-slate-400">
              <GripVertical :size="18" />
            </div>
            <h3 class="font-bold text-slate-700 uppercase text-xs tracking-wider">{{ category.title }}</h3>
          </div>
          
          <button class="transition-transform" :class="{ 'rotate-180': category.isOpen }" @click="category.isOpen = !category.isOpen">
            <ChevronDown :size="20" />
          </button>
        </div>

        <Transition name="expand">
          <div v-if="category.isOpen" class="bg-white">
            <VueDraggable
              v-model="category.transactions"
              group="transactions"
              handle=".item-handle"
              :animation="150"
              class="min-h-[50px] p-2 space-y-2"
              @add="onTransactionMove"
              @update="onTransactionMove"
            >
              <div
v-for="tx in category.transactions" :key="tx.id" 
                   class="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-blue-300 transition-colors group">
                
                <div class="flex items-center gap-3">
                  <div class="item-handle cursor-grab opacity-0 group-hover:opacity-100 text-slate-300">
                    <GripVertical :size="14" />
                  </div>
                  <input v-model="tx.name" class="text-sm font-medium focus:outline-none bg-transparent" >
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-sm text-slate-500">$</span>
                  <input v-model="tx.amount" type="number" class="w-16 text-sm text-right focus:outline-none bg-transparent" >
                </div>
              </div>
            </VueDraggable>

            <div v-if="category.transactions.length === 0" class="p-8 text-center text-xs text-slate-400 italic">
              Drag transactions here
            </div>
          </div>
        </Transition>
      </div>
    </VueDraggable>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.25s ease-out;
  max-height: 1000px;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

/* Styles for the "Ghost" item when dragging */
.sortable-ghost {
  opacity: 0.2;
  border: 2px dashed #3b82f6;
}
</style>