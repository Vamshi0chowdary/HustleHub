import { apiClient, toApiError } from './client'
import type { LoginRequest, SignupRequest } from './types'
import type { AuthSession, AuthUser } from '@/lib/auth/session'

interface AuthApiResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export async function loginRequest(payload: LoginRequest): Promise<AuthSession> {
  try {
    const response = await apiClient.post<AuthApiResponse>('/api/v1/auth/login', payload)
    return {
      accessToken: response.data.access_token,
      tokenType: response.data.token_type,
      user: response.data.user,
    }
  } catch (error) {
    throw toApiError(error)
  }
}

export async function signupRequest(payload: SignupRequest): Promise<AuthSession> {
  try {
    const response = await apiClient.post<AuthApiResponse>('/api/v1/auth/register', payload)
    return {
      accessToken: response.data.access_token,
      tokenType: response.data.token_type,
      user: response.data.user,
    }
  } catch (error) {
    throw toApiError(error)
  }
}
