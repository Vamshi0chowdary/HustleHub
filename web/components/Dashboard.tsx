'use client'

import { useState, useEffect } from 'react'
import { Users, Video, TrendingUp, Activity } from 'lucide-react'
import StatsCard from './StatsCard'
import UsersTable from './UsersTable'
import VideosTable from './VideosTable'
import AnalyticsChart from './AnalyticsChart'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalInteractions: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // In a real app, you'd fetch from your backend
      // For now, using mock data
      setStats({
        totalUsers: 1250,
        totalVideos: 340,
        totalInteractions: 5600,
        activeUsers: 890,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HustleHub Admin</h1>
              <p className="text-gray-600">Manage your ML-powered social platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Refresh ML Models
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Total Videos"
            value={stats.totalVideos.toLocaleString()}
            icon={Video}
            color="green"
          />
          <StatsCard
            title="Interactions"
            value={stats.totalInteractions.toLocaleString()}
            icon={Activity}
            color="purple"
          />
          <StatsCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString()}
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsChart
            title="User Growth"
            data={[120, 150, 180, 220, 280, 350, 420, 500, 580, 650, 720, 800]}
            labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
          />
          <AnalyticsChart
            title="Video Uploads"
            data={[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]}
            labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
          />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UsersTable />
          <VideosTable />
        </div>
      </main>
    </div>
  )
}