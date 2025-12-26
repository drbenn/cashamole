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
import type { CategoryDto, CategoryUsageType, CreateCategoryDto, DeactivateCategoryDto } from '@common-types'


const categoryStore = useCategoryStore()

interface Props {
  categoryUsageType: CategoryUsageType,
}

const props = defineProps<Props>();

// const categoryName = defineModel<string>()
const categoryName = ref<string>('')
const isCreateDialogOpen = ref<boolean>(false)
const isViewDialogOpen = ref<boolean>(false)

// state to track if we are in "Confirm Deactivate" mode
const categoryToDeactivate = ref<CategoryDto | null>(null)

const activeCategories = computed(() => {
  // Map the usage type to the specific store property
  if (props.categoryUsageType === 'transaction') return categoryStore.transaction.filter((cat) => !cat.is_system)
  if (props.categoryUsageType === 'asset') return categoryStore.asset.filter((cat) => !cat.is_system)
  if (props.categoryUsageType === 'liability') return categoryStore.liability.filter((cat) => !cat.is_system)
  return []
})



const handleSaveCategory = () => {
  if (!categoryName.value.trim()) return
  const dto: CreateCategoryDto = { name: categoryName.value, usage_type: props.categoryUsageType }
  categoryStore.createCategory(dto)
  isCreateDialogOpen.value = false
  categoryName.value = ''
}


const confirmDeactivation = (cat: CategoryDto) => {
  categoryToDeactivate.value = cat
}

const cancelDeactivation = () => {
  categoryToDeactivate.value = null
}

const finalDeactivateCategory = (categoryId: string) => {
  console.log(categoryId);
  const dto: DeactivateCategoryDto = { category_id: categoryId, usage_type: props.categoryUsageType }
  categoryStore.deactivateCategory(dto)
  categoryToDeactivate.value = null
}

const isSubmitDisabled = computed(() => {
  return categoryName.value.length === 0
})
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
            <DialogHeader>
              <DialogTitle>Active {{ capitalize(props.categoryUsageType) }} Categories</DialogTitle>
              <!-- <DialogDescription>
                {{ capitalize(props.categoryUsageType) }} Categories
              </DialogDescription> -->
            </DialogHeader>
            <div class="grid gap-4">
              <div class="grid gap-3">
                <Label for="name-1">Category Name</Label>
                <Input id="category-name" v-model="categoryName" name="category-name" placholder="Groceries" min-length="1" @keydown.enter="handleSaveCategory"/>
                <div class="mt-2 py-0 max-h-[40vh] overflow-y-scroll">
                  <ul class="space-y-1">
                    <li v-for="cat in activeCategories" :key="cat.id" class="py-1 px-2 bg-slate-100 rounded flex justify-between items-center">
                      <div>{{ cat.name }}</div>
                      <Button variant="outline" size="icon-sm" class="cursor-pointer text-rose-500"  @click="handleDeactivateCategory(cat.id || '')">
                        <CircleXIcon />
                      </Button>
                      </li>
                  </ul>
                  
                  <div v-if="activeCategories.length === 0" class="text-slate-400 text-sm italic">
                    No categories found for {{ props.categoryUsageType }}.
                  </div>
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
        </DialogContent>
      </Dialog>
    </ButtonGroup>
  </div>
</template>