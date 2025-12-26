import type { CreateCategoryDto, MigrateDeactivateCategoryDto, ReorderCategoriesDto, UpdateCategoryDto } from '@common-types'
import type { FetchError } from 'ofetch'
import type { ApiResponse } from "~/types/app.types"

export const useCategoryService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl + '/category'

  const createCategory = async (dto: CreateCategoryDto): Promise<ApiResponse> => {
    
    try {
      const response = await $fetch(`${apiBase}`, {
        method: 'POST',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const getUserCategories = async (): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}`, {
        method: 'GET',
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const updateCategory = async (dto: UpdateCategoryDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}`, { 
        method: 'PATCH',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data  }
    }
  }

  const reorderCategories = async (dto: ReorderCategoriesDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/reorder`, { 
        method: 'PATCH',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data  }
    }
  }

  const migrateThenDeactivateCategory = async (dto: MigrateDeactivateCategoryDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/deactivate`, {
        method: 'PATCH',
        body: dto,
        credentials: 'include'
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data  }
    }
  }

  return {
    createCategory,
    getUserCategories,
    updateCategory,
    reorderCategories,
    migrateThenDeactivateCategory,
  }
}