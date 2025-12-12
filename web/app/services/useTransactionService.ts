import type { TransactionDto, FetchTransactionsDto, DeactivateTransactionDto, UpdateTransactionFieldDto } from "@common-types"
import type { FetchError } from 'ofetch'
import type { ApiResponse } from "~/types/app.types"

export const useTransactionService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl

  const createTransaction = async (dto: TransactionDto): Promise<ApiResponse> => {
    
    try {
      const response = await $fetch(`${apiBase}/transaction`, {
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

  const allUserTransactions = async (dto: FetchTransactionsDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/transaction/all-user`, {
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

  const updateTransactionField = async (dto: UpdateTransactionFieldDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/transaction/${dto.transaction_id}`, { 
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

  const deactivateTransaction = async (dto: DeactivateTransactionDto): Promise<ApiResponse> => {
    try {
      const response = await $fetch(`${apiBase}/transaction/deactivate/${dto.transaction_id}`, {
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
    createTransaction,
    allUserTransactions,
    updateTransactionField,
    deactivateTransaction,
  }
}