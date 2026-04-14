export interface ApiError {
  status: number
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  username: string
  email: string
  phone?: string
  password: string
  bio?: string
  skills?: string[]
  level?: string
}

export interface VideoFeedItem {
  id: string
  user_id: string
  title?: string
  caption: string
  tags: string[]
  difficulty_level?: string
  duration_seconds?: number
  category?: string
  likes_count: number
  comments_count: number
  views_count?: number
  created_at: string
  score?: number
  rank_score?: number
  ann_similarity?: number
}

export interface FeedResponse {
  videos: VideoFeedItem[]
}

export type FeedbackAction = 'watch' | 'like' | 'skip' | 'save' | 'share'

export interface FeedbackRequest {
  video_id: string
  action: FeedbackAction
  watch_time_ratio?: number
  session_time?: number
}

export interface RecommendedUser {
  id: string
  name: string
  username: string
  email: string
  bio?: string
  skills: string[]
  level: string
  activity_score: number
  followers_count: number
  following_count: number
  score?: number
  embedding_similarity?: number
}

export interface DiscoverUsersResponse {
  users: RecommendedUser[]
}
