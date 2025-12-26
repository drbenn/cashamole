<script setup lang="ts">
// import { Separator } from '@/components/ui/separator'
import { PlusIcon, CircleXIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CategoryDto, CategoryUsageType, CreateCategoryDto, MigrateDeactivateCategoryDto } from '@common-types'


const categoryStore = useCategoryStore()

interface Props {
  categoryUsageType: CategoryUsageType,
}

const props = defineProps<Props>();

// 
//
//      dialog controls
//
// const categoryName = defineModel<string>()
const isCreateDialogOpen = ref<boolean>(false)
const isViewDialogOpen = ref<boolean>(false)
    
// 
//
//      create category
//
const categoryName = ref<string>('')
const isSubmitDisabled = computed(() => {
  return categoryName.value.length === 0
})

// 
//
//      categories listing
//
const activeCategories = computed(() => {
  // Map the usage type to the specific store property
  if (props.categoryUsageType === 'transaction') return categoryStore.transaction.filter((cat) => !cat.is_system)
  if (props.categoryUsageType === 'asset') return categoryStore.asset.filter((cat) => !cat.is_system)
  if (props.categoryUsageType === 'liability') return categoryStore.liability.filter((cat) => !cat.is_system)
  return []
})


// save in add category and category detail listing
const handleSaveCategory = () => {
  if (!categoryName.value.trim()) return
  const dto: CreateCategoryDto = { name: categoryName.value, usage_type: props.categoryUsageType }
  categoryStore.createCategory(dto)
  isCreateDialogOpen.value = false
  categoryName.value = ''
}


//
//      DEACTIVATION
//


// state to track if we are in "Confirm Deactivate" mode
const categoryToDeactivate = ref<CategoryDto | null>(null)

const proceedToMigrationDeactivation = (cat: CategoryDto) => {
  categoryToDeactivate.value = cat
}

const cancelDeactivation = () => {
  categoryToDeactivate.value = null
}

const startDeactivateProcess = (cat: CategoryDto) => {
  categoryToDeactivate.value = cat
}

// Track where the user wants to move the data
const migrationTargetId = ref<string>('')

const handleFinalDeactivate = () => {
  if (!categoryToDeactivate.value) return
  const dto: MigrateDeactivateCategoryDto = { 
    category_id: categoryToDeactivate.value.id!,
    usage_type: props.categoryUsageType,
    migrate_target_category_id: migrationTargetId.value
  
  }
  categoryStore.migrateThenDeactivateCategory(dto)
  isViewDialogOpen.value=false
  categoryToDeactivate.value = null
  migrationTargetId.value = ''
}


</script>

<template>
  <div>
    <ButtonGroup>
      <Dialog v-model:open="isCreateDialogOpen">
        <DialogTrigger as-child>
          <Button variant="outline" size="icon-sm" class="cursor-pointer">
            <PlusIcon />
          </Button>
          </DialogTrigger>
          
          <DialogContent v-model="isCreateDialogOpen" class="sm:max-w-[425px] select-none" variant="">
            <DialogHeader>
              <DialogTitle>Add category</DialogTitle>
              <DialogDescription>
                Add {{ capitalize(props.categoryUsageType) }} category
              </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4">
              <div class="grid gap-3">
                <Label for="name-1">Category Name</Label>
                <Input id="category-name" v-model="categoryName" name="category-name" placholder="Groceries" min-length="1" @keydown.enter="handleSaveCategory"/>
              </div>
            </div>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" :disabled="isSubmitDisabled" class="cursor-pointer" @click="handleSaveCategory">
                Save
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog v-model:open="isViewDialogOpen">
        <DialogTrigger as-child>
          <Button variant="outline" size="sm" class="cursor-pointer">
            Categories
          </Button>
          </DialogTrigger>
          <DialogContent v-model="isViewDialogOpen" class="sm:max-w-[425px] select-none" variant="">

            <div v-if="categoryToDeactivate">
              <DialogHeader>
                <DialogTitle>Active {{ capitalize(props.categoryUsageType) }} Categories</DialogTitle>
                <!-- <DialogDescription>
                  {{ capitalize(props.categoryUsageType) }} Categories
                </DialogDescription> -->
              </DialogHeader>
                <div v-if="categoryToDeactivate === null" class="grid gap-4">
                  <div class="grid gap-3">
                    <Label for="name-1">Category Name</Label>
                    <Input id="category-name" v-model="categoryName" name="category-name" placholder="Groceries" min-length="1" @keydown.enter="handleSaveCategory"/>
                    <div class="mt-2 py-0 max-h-[40vh] overflow-y-scroll">
                      <ul class="space-y-1">
                        <li v-for="cat in activeCategories" :key="cat.id" class="py-1 px-2 bg-slate-100 rounded flex justify-between items-center">
                          <div>{{ cat.name }}</div>
                          <Button variant="outline" size="icon-sm" class="cursor-pointer text-rose-500"  @click="startDeactivateProcess(cat|| '')">
                            <CircleXIcon />
                          </Button>
                          </li>
                      </ul>
                      
                      <div v-if="activeCategories.length === 0" class="text-slate-400 text-sm italic">
                        No categories found for {{ props.categoryUsageType }}.
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose as-child>
                      <Button variant="outline" class="cursor-pointer">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </div>
            </div>

            <div v-if="categoryToDeactivate !== null">
              <!-- <DialogHeader>
                <DialogTitle class="text-rose-600">Deactivate {{ categoryToDeactivate.name }}?</DialogTitle>
                <DialogDescription class="py-2">
                  <p class="mb-3 text-slate-900 font-medium">
                    All items in this category will be moved to <strong>Uncategorized</strong>.
                  </p>

                  <div class="bg-amber-50 border-l-4 border-amber-400 p-3 text-amber-800 text-xs">
                    <strong>Pro-tip:</strong> If you're just fixing a mistake, try 
                    <span class="underline font-bold">renaming</span> the category instead to keep your history organized.
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter class="mt-4 gap-2">
                <Button variant="outline" @click="cancelDeactivation">Cancel</Button>
                <Button variant="destructive" @click="handleFinalDeactivate(categoryToDeactivate.id!)">Confirm Deactivation</Button>
              </DialogFooter> -->
              <DialogHeader>
                <DialogTitle class="text-rose-600">Deactivate "{{ categoryToDeactivate.name }}"?</DialogTitle>
                <DialogDescription class="pt-2">
                  Where should we move the items currently in this category?
                </DialogDescription>
              </DialogHeader>

              <div class="py-4 space-y-4">
                <div class="grid gap-2">
                  <Label>Move items to:</Label>
                  <select 
                    v-model="migrationTargetId" 
                    class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                  >
                    <option value="">(Default) Uncategorized</option>
                    <option 
                      v-for="cat in activeCategories.filter(c => c.id !== categoryToDeactivate?.id)" 
                      :key="cat.id" 
                      :value="cat.id"
                    >
                      {{ cat.name }}
                    </option>
                  </select>
                </div>

                <div class="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800 text-xs">
                  <strong>Continuity Note:</strong> Moving items to a specific category (like "Dining Out") helps keep your spending reports accurate.
                </div>
              </div>

              <DialogFooter class="gap-2">
                <Button variant="outline" @click="cancelDeactivation">Go Back</Button>
                <Button variant="destructive" @click="handleFinalDeactivate">
                  Migrate & Deactivate
                </Button>
              </DialogFooter>
            </div>

            <div v-else>
              <DialogHeader>
                <DialogTitle>Active {{ capitalize(props.categoryUsageType) }} Categories</DialogTitle>
              </DialogHeader>
              
              <div class="grid gap-4 py-4">
                <ul class="space-y-1 max-h-[40vh] overflow-y-auto">
                  <li 
                    v-for="cat in activeCategories" :key="cat.id" 
                    class="py-1 px-2 bg-slate-100 rounded flex justify-between items-center">
                    <span>{{ cat.name }}</span>
                    <Button variant="ghost" size="icon-sm" class="text-rose-500" @click="proceedToMigrationDeactivation(cat)">
                      <CircleXIcon />
                    </Button>
                  </li>
                </ul>
              </div>

              <DialogFooter>
                <DialogClose as-child><Button variant="outline">Close</Button></DialogClose>
              </DialogFooter>
            </div>



        </DialogContent>
      </Dialog>
    </ButtonGroup>
  </div>
</template>