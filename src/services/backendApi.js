import AsyncStorage from '@react-native-async-storage/async-storage';

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const FALLBACK_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = `${(RAW_BASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '')}/api/v1`;

const TOKEN_KEY = 'hh_access_token';
const USER_KEY = 'hh_user';

// Simple in-memory cache for GET requests
const apiCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

async function request(path, options = {}, requireAuth = false) {
  const isGet = !options.method || options.method === 'GET';
  const cacheKey = `${path}-${requireAuth}`;

  if (isGet && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    } else {
      apiCache.delete(cacheKey);
    }
  }

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (requireAuth) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error('No auth token found. Please login again.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = isJson ? payload?.message || payload?.detail || payload?.error : payload;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  if (isGet) {
    apiCache.set(cacheKey, { data: payload, timestamp: Date.now() });
  }

  return payload;
}

export function clearCache() {
  apiCache.clear();
}

export async function register(payload) {
  const data = await request(
    '/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    false
  );

  await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function login(payload) {
  const data = await request(
    '/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    false
  );

  await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function hasSession() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return Boolean(token);
}

export async function logout() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function getFeed(mode = 'latest', limit = 20) {
  const query = `?mode=${encodeURIComponent(mode)}&limit=${encodeURIComponent(limit)}`;
  return request(`/posts/feed${query}`, { method: 'GET' }, true);
}

export async function likePost(postId) {
  return request(
    '/posts/like',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    },
    true
  );
}

export async function bookmarkPost(postId) {
  return request(
    '/posts/bookmark',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    },
    true
  );
}

export async function uploadPost({ fileUri, caption = '', tags = [], mentions = [] }) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('No auth token found. Please login again.');
  }

  const formData = new FormData();
  formData.append('caption', caption);
  formData.append('tags', tags.join(','));
  formData.append('mentions', mentions.join(','));
  if (fileUri) {
    // Basic determination of media type by extension
    const isVideo = fileUri.endsWith('.mp4') || fileUri.endsWith('.mov');
    formData.append('file', {
      uri: fileUri,
      name: `upload-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
      type: isVideo ? 'video/mp4' : 'image/jpeg',
    });
  }

  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = isJson ? payload?.message || payload?.detail || payload?.error : payload;
    throw new Error(detail || `Upload failed with status ${response.status}`);
  }

  return payload;
}

export async function getDiscoverUsers(limit = 12) {
  return request(`/discover/users?limit=${encodeURIComponent(limit)}`, { method: 'GET' }, true);
}

export async function getDiscoverPosts(limit = 20) {
  return request(`/discover/posts?limit=${encodeURIComponent(limit)}`, { method: 'GET' }, true);
}

export async function getCurrentUser() {
  return request('/user/me', { method: 'GET' }, true);
}

export async function updateProfile(updates) {
  return request(
    '/user/me',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
    true
  );
}

export async function updateAvatar(fileUri) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('No auth token found. Please login again.');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: `avatar-${Date.now()}.jpg`,
    type: 'image/jpeg',
  });

  const response = await fetch(`${API_BASE_URL}/user/me/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = isJson ? payload?.message || payload?.detail || payload?.error : payload;
    throw new Error(detail || `Avatar upload failed with status ${response.status}`);
  }

  return payload;
}

export async function getMyPosts(limit = 100) {
  return request(`/user/me/posts?limit=${encodeURIComponent(limit)}`, { method: 'GET' }, true);
}

export async function getGroups(limit = 30) {
  // In a real app we'd have a GET /groups endpoint. For now simulating with a general GET
  // We'll just rely on community posts for demo if needed, but assuming a /groups exists:
  // Since we only made POST /groups in backend, let's keep CommunityPosts to demonstrate feed
  return request(`/community/posts?limit=${encodeURIComponent(limit)}`, { method: 'GET' }, true);
}

export async function createCommunityPost(text) {
  return request(
    '/community/posts',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
    true
  );
}

export async function getJobs(jobType = '', skills = '', limit = 50) {
  const query = `?limit=${limit}&job_type=${encodeURIComponent(jobType)}&skills=${encodeURIComponent(skills)}`;
  return request(`/career/jobs${query}`, { method: 'GET' }, true);
}

export async function followUser(targetUserId) {
  return request(
    '/user/follow',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: targetUserId }),
    },
    true
  );
}

// --- AI Service Methods ---

export async function getAICareerAdvice(query) {
  return request(
    '/ai/career-assistant',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    },
    true
  );
}

export async function getAIStudyPlan(query) {
  return request(
    '/ai/study-assistant',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    },
    true
  );
}

export async function getAISummary(text) {
  return request(
    '/ai/summarize',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
    true
  );
}

export async function getAILearningPath(targetSkill) {
  return request(
    '/ai/learning-path',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_skill: targetSkill }),
    },
    true
  );
}

export async function semanticSearchPosts(q, limit = 10) {
  return request(`/ai/search/posts?q=${encodeURIComponent(q)}&limit=${limit}`, { method: 'GET' }, true);
}

export async function semanticSearchUsers(q, limit = 10) {
  return request(`/ai/search/users?q=${encodeURIComponent(q)}&limit=${limit}`, { method: 'GET' }, true);
}

export { API_BASE_URL, RAW_BASE_URL };

