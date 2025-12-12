import type { SnapshotDto, FetchSnapshotsDto, DeactivateSnapshotDto, UpdateSnapshotFieldDto } from "@common-types"
import type { FetchError } from 'ofetch'
import type { ApiResponse } from "~/types/app.types"

export const useSnapshotService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl

  const createSnapshot = async (dto: SnapshotDto): Promise<ApiResponse> => {
    
    try {
      const response = await $fetch(`${apiBase}/snapshot`, {
        method: 'POST',
        body: dto,
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const allUserSnapshots = async (dto: FetchSnapshotsDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/snapshot/all-user`, {
        method: 'POST',
        body: dto,
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data }
    }
  }

  const updateSnapshotField = async (dto: UpdateSnapshotFieldDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/snapshot/${dto.snapshot_id}`, { 
        method: 'PATCH',
        body: dto
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data  }
    }
  }

  const deactivateSnapshot = async (dto: DeactivateSnapshotDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/snapshot/deactivate/${dto.snapshot_id}`, {
        method: 'PATCH',
        body: dto,
      })
      return { success: true, data: response }
    }
    catch (err) {
      const error = err as FetchError
      return { success: false, error: error.data?.message, data: error.data?.data  }
    }
  }

  return {
    createSnapshot,
    allUserSnapshots,
    updateSnapshotField,
    deactivateSnapshot,
  }
}