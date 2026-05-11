import axios, { AxiosError } from 'axios'
import type { ApiError } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
const FALLBACK_API_BASE_URL = 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL || FALLBACK_API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string; error?: string }>
    const status = axiosError.response?.status ?? 500
    const detail = axiosError.response?.data?.message ?? axiosError.response?.data?.detail ?? axiosError.response?.data?.error
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
