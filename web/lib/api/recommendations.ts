import { apiClient, toApiError } from './client'
import type {
  DiscoverUsersResponse,
  FeedbackRequest,
  FeedResponse,
} from './types'

export async function getRecommendedFeed(limit = 20): Promise<FeedResponse> {
  try {
    const response = await apiClient.get<FeedResponse>('/api/v1/recommend/feed', {
      params: { limit },
    })
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function sendRecommendationFeedback(payload: FeedbackRequest): Promise<void> {
  try {
    await apiClient.post('/api/v1/recommend/feedback', payload, {
    })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getRecommendedUsers(limit = 18): Promise<DiscoverUsersResponse> {
  try {
    const response = await apiClient.get<DiscoverUsersResponse>('/api/v1/recommend/users', {
      params: { limit },
    })
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}
