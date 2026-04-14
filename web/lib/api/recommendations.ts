import { apiClient, toApiError } from './client'
import type {
  DiscoverUsersResponse,
  FeedbackRequest,
  FeedResponse,
} from './types'

export async function getRecommendedFeed(accessToken: string, limit = 20): Promise<FeedResponse> {
  try {
    const response = await apiClient.get<FeedResponse>('/api/v1/recommend/feed', {
      params: { limit },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function sendRecommendationFeedback(accessToken: string, payload: FeedbackRequest): Promise<void> {
  try {
    await apiClient.post('/api/v1/recommend/feedback', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getRecommendedUsers(accessToken: string, limit = 18): Promise<DiscoverUsersResponse> {
  try {
    const response = await apiClient.get<DiscoverUsersResponse>('/api/v1/recommend/users', {
      params: { limit },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}
