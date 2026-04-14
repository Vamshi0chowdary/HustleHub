// src/services/recommendationService.js
const API_BASE_URL = 'http://localhost:8000'; // Change to your deployed URL

export async function getFeedRecommendations(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/recommend/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feed recommendations');
    }

    const data = await response.json();
    return data.recommendations;
  } catch (error) {
    console.error('Error fetching feed recommendations:', error);
    throw error;
  }
}

export async function getUserRecommendations(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/recommend/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user recommendations');
    }

    const data = await response.json();
    return data.recommendations;
  } catch (error) {
    console.error('Error fetching user recommendations:', error);
    throw error;
  }
}

export async function getStudyPartnerRecommendations(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/recommend/study-partners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch study partner recommendations');
    }

    const data = await response.json();
    return data.recommendations;
  } catch (error) {
    console.error('Error fetching study partner recommendations:', error);
    throw error;
  }
}