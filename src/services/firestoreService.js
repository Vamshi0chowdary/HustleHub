// src/services/firestoreService.js
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { calculateSimilarityScore, calculateFeedScore, getRecencyFactor } from '../utils/algorithms';

// Users collection
export async function createUser(userData) {
  try {
    const docRef = await addDoc(collection(db, 'users'), userData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

export async function getUser(userId) {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

// Videos collection
export async function createVideo(videoData) {
  try {
    const docRef = await addDoc(collection(db, 'videos'), videoData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

export async function getVideos() {
  try {
    const querySnapshot = await getDocs(collection(db, 'videos'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting videos:', error);
    throw error;
  }
}

// Posts collection
export async function createPost(postData) {
  try {
    const docRef = await addDoc(collection(db, 'posts'), postData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

export async function getPosts() {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
}

// UserMatches collection
export async function createUserMatch(matchData) {
  try {
    const docRef = await addDoc(collection(db, 'userMatches'), matchData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
}

export async function getUserMatches(userId) {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'userMatches'), where('userId', '==', userId), orderBy('score', 'desc')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting matches:', error);
    throw error;
  }
}

// Calculate and store matches for a user
export async function calculateAndStoreMatches(userId) {
  try {
    const users = await getUsers();
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser) return;

    const matches = users
      .filter(u => u.id !== userId)
      .map(other => ({
        userId,
        matchedUserId: other.id,
        score: calculateSimilarityScore(currentUser, other)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Clear old matches
    const oldMatches = await getUserMatches(userId);
    oldMatches.forEach(async (match) => {
      await updateDoc(doc(db, 'userMatches', match.id), { score: 0 }); // Or delete
    });

    // Add new matches
    matches.forEach(async (match) => {
      await createUserMatch(match);
    });
  } catch (error) {
    console.error('Error calculating matches:', error);
  }
}

// Get personalized feed videos
export async function getPersonalizedFeed(userId) {
  try {
    const videos = await getVideos();
    const user = await getUser(userId);
    const matches = await getUserMatches(userId);

    const scoredVideos = videos.map(video => {
      const creator = video.userId;
      const similarity = matches.find(m => m.matchedUserId === creator)?.score || 0;
      const recency = getRecencyFactor(video.createdAt);
      const feedScore = calculateFeedScore(video, similarity, recency, video.likes || 0);
      return { ...video, feedScore };
    });

    return scoredVideos.sort((a, b) => b.feedScore - a.feedScore);
  } catch (error) {
    console.error('Error getting personalized feed:', error);
    throw error;
  }
}