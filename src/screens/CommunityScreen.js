// src/screens/CommunityScreen.js
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { getPosts, createPost } from '../services/firestoreService';
import { auth } from '../services/firebase';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Body, Caption, Subtitle, Title } from '../components/ui/Typography';
import { useTheme } from '../theme/ThemeProvider';

function PostItem({ item }) {
  const theme = useTheme();
  return (
    <Card style={styles.postItem} interactive>
      <Subtitle>{item.userName || 'Anonymous'}</Subtitle>
      <Body style={styles.postText}>{item.text || ''}</Body>
      <Caption color={theme.colors.textMuted}>{new Date(item.createdAt).toLocaleString()}</Caption>
    </Card>
  );
}

function CommunitySkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton width="30%" height={18} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={16} style={{ marginBottom: 6 }} />
      <Skeleton width="80%" height={16} style={{ marginBottom: 12 }} />
      <Skeleton width="36%" height={14} />
    </View>
  );
}

export default function CommunityScreen() {
  const theme = useTheme();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const postsData = await getPosts();
      setPosts(postsData || []);
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) {
      setError('Please write something before posting.');
      return;
    }

    setPosting(true);
    setError('');

    try {
      const userId = auth.currentUser?.uid || 'user1';
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      await createPost({
        userId,
        text: newPost.trim(),
        createdAt: new Date().toISOString(),
      });

      setNewPost('');
      await loadPosts(true);
    } catch (e) {
      setError('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Screen>
      <FlatList
        data={loading ? [{ id: 's1' }, { id: 's2' }, { id: 's3' }] : posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            refreshing={refreshing}
            onRefresh={() => loadPosts(true)}
          />
        }
        contentContainerStyle={styles.container}
        renderItem={({ item }) => (loading ? <CommunitySkeleton /> : <PostItem item={item} />)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Title>Community</Title>
              <Body color={theme.colors.textSecondary} style={{ marginTop: 4 }}>
                Share progress, get feedback, and help each other grow.
              </Body>
            </View>

            <Card style={styles.composeCard}>
              <Subtitle>New post</Subtitle>
              <Input
                placeholder="Share your thoughts..."
                value={newPost}
                onChangeText={(value) => {
                  if (error) setError('');
                  setNewPost(value);
                }}
                multiline
                style={{ marginTop: 12 }}
              />

              {error ? <Caption color={theme.colors.danger} style={styles.errorText}>{error}</Caption> : null}

              <Button
                title="Post"
                onPress={handlePost}
                loading={posting}
                disabled={posting}
              />
            </Card>

            <View style={styles.feedHeader}>
              <Subtitle>Latest posts</Subtitle>
              {!loading ? <Caption>{posts.length}</Caption> : null}
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <Card>
              <Body color={theme.colors.textSecondary}>No posts yet. Be the first to share.</Body>
            </Card>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerBlock: {
    marginBottom: 12,
  },
  composeCard: {
    marginBottom: 14,
  },
  errorText: {
    marginTop: -2,
    marginBottom: 10,
    fontWeight: '600',
  },
  feedHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postItem: {
    marginBottom: 12,
  },
  postText: {
    marginTop: 8,
    marginBottom: 8,
  },
  skeletonWrap: {
    marginBottom: 12,
  },
});
