import axios, { AxiosError } from 'axios'
import type { ApiError } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required and must point to your backend URL')
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>
    const status = axiosError.response?.status ?? 500
    const detail = axiosError.response?.data?.detail
    return {
      status,
      message: detail ?? axiosError.message ?? 'Request failed',
    }
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : 'Unexpected error',
  }
}
