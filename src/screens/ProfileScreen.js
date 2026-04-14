// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Video } from 'expo-av';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { getUser, getVideos, updateDoc, doc, db } from '../services/firestoreService';
import { auth } from '../services/firebase';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Body, Caption, Subtitle, Title } from '../components/ui/Typography';
import { useTheme } from '../theme/ThemeProvider';

function XPBar({ xp }) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min((xp || 0) / 100, 1), {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, xp]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.xpContainer}>
      <View style={[styles.xpBar, { backgroundColor: theme.mode === 'light' ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.16)' }]}>
        <Animated.View style={[styles.xpFill, animatedStyle, { backgroundColor: '#FFFFFF' }]} />
      </View>
      <Caption color="rgba(255,255,255,0.85)" style={styles.xpText}>{xp || 0} XP</Caption>
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton height={130} style={{ marginBottom: 16 }} />
      <Skeleton width="55%" height={20} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="82%" height={16} style={{ marginBottom: 20 }} />
      <Skeleton height={150} />
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editSkills, setEditSkills] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const userId = auth.currentUser?.uid || 'user1';
      if (!userId) return;

      const userData = await getUser(userId);
      setUser(userData);
      setEditSkills(userData?.skills?.join(', ') || '');

      const userVideos = await getVideos();
      setVideos(userVideos.filter((v) => v.userId === userId));
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError('');

    try {
      const userId = auth.currentUser?.uid || 'user1';
      if (!userId) return;

      const skillsArray = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateDoc(doc(db, 'users', userId), { skills: skillsArray });
      setUser((prev) => ({ ...prev, skills: skillsArray }));
      setEditing(false);
    } catch (e) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const renderVideo = ({ item }) => (
    <Card style={styles.videoItem}>
      <Video
        source={{ uri: item.videoUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
        shouldPlay={false}
      />
      <Caption style={{ marginTop: 8 }} numberOfLines={2}>{item.caption || 'Untitled video'}</Caption>
    </Card>
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.container}>
          <ProfileSkeleton />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.centerState}>
          <Title>No profile yet</Title>
          <Body color={theme.colors.textSecondary} style={styles.stateBody}>Create your profile data to personalize HustleHub.</Body>
          <Button title="Reload" onPress={() => loadProfile(false)} variant="secondary" style={styles.actionButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideo}
        horizontal
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
          />
        }
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={theme.mode === 'light' ? ['#4F46E5', '#6366F1'] : ['#2A2A4A', '#3F3F8F']}
              style={styles.header}
            >
              <Title color="#FFFFFF" style={styles.name}>{user.name || 'HustleHub User'}</Title>
              <Body color="rgba(255,255,255,0.85)" style={styles.college}>{user.college || 'Creator'}</Body>
              <XPBar xp={user.xp || 0} />
            </LinearGradient>

            {error ? <Caption color={theme.colors.danger} style={styles.errorText}>{error}</Caption> : null}

            <Card style={styles.section}>
              <Subtitle>Skills</Subtitle>
              {editing ? (
                <Input
                  value={editSkills}
                  onChangeText={(value) => {
                    if (error) setError('');
                    setEditSkills(value);
                  }}
                  placeholder="Enter skills separated by commas"
                  multiline
                  style={{ marginTop: 12 }}
                />
              ) : (
                <Body color={theme.colors.textSecondary} style={{ marginTop: 8 }}>
                  {user.skills?.join(', ') || 'No skills added'}
                </Body>
              )}

              <Button
                title={editing ? 'Save skills' : 'Edit skills'}
                onPress={editing ? saveProfile : () => setEditing(true)}
                loading={saving}
                style={styles.actionButton}
              />
            </Card>

            <Card style={styles.section}>
              <Subtitle>Progress</Subtitle>
              <Body color={theme.colors.textSecondary} style={{ marginTop: 8 }}>
                Goal: {user.goal || 'Not set'}
              </Body>
              <Body color={theme.colors.textSecondary} style={{ marginTop: 4 }}>
                Level: {user.level || 'beginner'}
              </Body>
            </Card>

            <View style={styles.videoHeaderRow}>
              <Subtitle>My Videos</Subtitle>
              <Caption>{videos.length}</Caption>
            </View>
          </>
        }
        ListEmptyComponent={
          <Card style={{ marginTop: 8 }}>
            <Body color={theme.colors.textSecondary}>No videos uploaded yet.</Body>
          </Card>
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
  skeletonWrap: {
    marginTop: 16,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  stateBody: {
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: 18,
  },
  name: {
    fontSize: 30,
    fontWeight: '700',
  },
  college: {
    marginTop: 4,
  },
  xpContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  xpBar: {
    width: 220,
    height: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
  },
  xpText: {
    marginTop: 6,
  },
  errorText: {
    marginBottom: 10,
    fontWeight: '600',
  },
  section: {
    marginBottom: 14,
  },
  actionButton: {
    marginTop: 12,
  },
  videoHeaderRow: {
    marginTop: 2,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoItem: {
    marginRight: 12,
    width: 164,
    padding: 10,
  },
  thumbnail: {
    width: '100%',
    height: 214,
    borderRadius: 14,
    backgroundColor: '#0B0B0F',
  },
});
