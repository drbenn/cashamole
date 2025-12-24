<script setup lang="ts">
import { Separator } from '@/components/ui/separator'
import { PlusIcon } from 'lucide-vue-next'
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
import type { CreateCategoryDto } from '@common-types'

const appStore = useAppStore()

const handleAddCategory = () => {
  // open dialog
}

// const handleOpenCategories = () => {

// }


const handleSaveCategory= () => {
  const dto: CreateCategoryDto = { name: categoryName.value, usage_type: 'transaction'}
  appStore.createCategory(dto)
}
// const categoryName = defineModel<string>()
const categoryName = ref<string>('')


const isSubmitDisabled = computed(() => {
  return categoryName.value.length === 0
})
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">

    <ButtonGroup>
      <Button variant="outline" @click="handleAddCategory" size="icon-sm">
        <PlusIcon />
      </Button>
      <Button variant="outline" size="sm">
        Categories
      </Button>
    </ButtonGroup>

      <Dialog>
    <form>
      <DialogTrigger as-child>
        <Button variant="outline">
          Open Dialog
        </Button>
      </DialogTrigger>
      <DialogContent class="sm:max-w-[425px]" variant="">
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
          <DialogDescription>
            Add category in transactions | assets | liabilties
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="grid gap-3">
            <Label for="name-1">Category Name</Label>
            <Input id="category-name" v-model="categoryName" name="category-name" placholder="Groceries" min-length="1"/>
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" :disabled="isSubmitDisabled" @click="handleSaveCategory">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>


    <!-- <div class="flex h-5 items-center space-x-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
    </div> -->


      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 cursor-default">User Transactions</h1>
      </div>

    </div>
  </div>
</template>