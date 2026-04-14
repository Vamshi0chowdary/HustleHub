'use client'

import { useState, useEffect } from 'react'
import { Play, Eye } from 'lucide-react'

interface Video {
  id: string
  userId: string
  caption: string
  likes: number
  views: number
  createdAt: string
  tags: string[]
}

export default function VideosTable() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      // Mock data - in real app, fetch from backend
      const mockVideos: Video[] = [
        {
          id: '1',
          userId: '1',
          caption: 'DSA Problem Solving Tips',
          likes: 25,
          views: 150,
          createdAt: '2024-01-15',
          tags: ['DSA', 'Python'],
        },
        {
          id: '2',
          userId: '2',
          caption: 'ML Interview Preparation',
          likes: 40,
          views: 220,
          createdAt: '2024-01-14',
          tags: ['ML', 'Interview'],
        },
        {
          id: '3',
          userId: '3',
          caption: 'C++ Fundamentals',
          likes: 15,
          views: 80,
          createdAt: '2024-01-13',
          tags: ['C++', 'Basics'],
        },
      ]
      setVideos(mockVideos)
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Videos</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Recent Videos</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {videos.map((video) => (
          <div key={video.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Play className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {video.caption}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="h-4 w-4 mr-1" />
                        {video.views}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        ❤️ {video.likes}
                      </div>
                      <div className="text-sm text-gray-500">
                        {video.createdAt}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}