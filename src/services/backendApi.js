import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE = Platform.select({
  android: 'http://10.0.2.2:8000',
  ios: 'http://localhost:8000',
  default: 'http://localhost:8000',
});

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE;
const API_BASE_URL = `${RAW_BASE_URL.replace(/\/$/, '')}/api/v1`;

const TOKEN_KEY = 'hh_access_token';
const USER_KEY = 'hh_user';

async function request(path, options = {}, requireAuth = false) {
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
    const detail = isJson ? payload?.detail || payload?.message : payload;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return payload;
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
  return request(`/video/feed${query}`, { method: 'GET' }, true);
}

export async function likeVideo(videoId) {
  return request(
    '/video/like',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId }),
    },
    true
  );
}

export async function uploadVideo({ fileUri, caption = '', tags = [] }) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('No auth token found. Please login again.');
  }

  const formData = new FormData();
  formData.append('caption', caption);
  formData.append('tags', tags.join(','));
  formData.append('file', {
    uri: fileUri,
    name: `upload-${Date.now()}.mp4`,
    type: 'video/mp4',
  });

  const response = await fetch(`${API_BASE_URL}/video/upload`, {
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
    const detail = isJson ? payload?.detail || payload?.message : payload;
    throw new Error(detail || `Upload failed with status ${response.status}`);
  }

  return payload;
}

export async function getDiscoverUsers(limit = 12) {
  return request(`/discover/users?limit=${encodeURIComponent(limit)}`, { method: 'GET' }, true);
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

export { API_BASE_URL, RAW_BASE_URL };
