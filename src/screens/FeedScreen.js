// src/screens/FeedScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Dimensions,
  View,
} from 'react-native';
import { Video } from 'expo-av';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { getFeed, likeVideo } from '../services/backendApi';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Body, Caption, Title } from '../components/ui/Typography';
import { useTheme } from '../theme/ThemeProvider';

const { width } = Dimensions.get('window');

function VideoItem({ item, onLike, isVisible }) {
  const theme = useTheme();
  const videoRef = useRef(null);
  const likeScale = useSharedValue(1);
  const heartScale = useSharedValue(0);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.playAsync();
    } else if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isVisible]);

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleDoubleTap = () => {
    heartScale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }, () => {
      heartScale.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
    });
    runOnJS(onLike)(item.id);
  };

  const handleLikePress = () => {
    likeScale.value = withTiming(1.02, { duration: 120 }, () => {
      likeScale.value = withTiming(1, { duration: 180 });
    });
    onLike(item.id);
  };

  return (
    <Card style={[styles.videoCard, theme.shadow.raised]}>
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.END) {
            handleDoubleTap();
          }
        }}
        numberOfTaps={2}
      >
        <View style={[styles.videoWrapper, { borderColor: theme.colors.border }]}> 
          <Video
            ref={videoRef}
            source={{ uri: item.video_url }}
            style={styles.video}
            resizeMode="contain"
            isLooping
            shouldPlay={false}
          />
          <Animated.View style={[styles.heart, animatedHeartStyle, { backgroundColor: theme.colors.overlay }]}> 
            <Text style={styles.heartText}>❤️</Text>
          </Animated.View>
        </View>
      </TapGestureHandler>
      <View style={styles.metaRow}>
        <View style={[styles.captionContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Body style={[styles.caption, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {item.caption || 'Untitled post'}
          </Body>
          <Caption style={[styles.helperText, { color: theme.colors.textMuted }]}>Double tap to like</Caption>
        </View>
        <Animated.View style={animatedLikeStyle}>
          <Button
            title={`${item.likes_count || 0} likes`}
            onPress={handleLikePress}
            variant="secondary"
            style={styles.likeButton}
          />
        </Animated.View>
      </View>
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton height={280} style={{ marginBottom: 12 }} />
      <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="45%" height={14} />
    </View>
  );
}

export default function FeedScreen() {
  const theme = useTheme();
  const [videos, setVideos] = useState([]);
  const [visibleIndex, setVisibleIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setVisibleIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const result = await getFeed('latest', 20);
      setVideos(result.videos || []);
      setVisibleIndex(0);
    } catch (error) {
      setError(error?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (videoId) => {
    try {
      const result = await likeVideo(videoId);
      const increment = result.status === 'liked' ? 1 : -1;
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, likes_count: Math.max((v.likes_count || 0) + increment, 0) }
            : v
        )
      );
    } catch (error) {
      setError(error?.message || 'Failed to update like');
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.loadingContainer}>
          <Title style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>For You</Title>
          <FeedSkeleton />
          <FeedSkeleton />
          <FeedSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  if (error && videos.length === 0) {
    return (
      <Screen>
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>Could not load feed</Text>
          <Text style={[styles.stateBody, { color: theme.colors.textSecondary }]}>{error}</Text>
          <Button title="Try again" onPress={() => loadFeed(false)} style={styles.retryButton} />
        </View>
      </Screen>
    );
  }

  if (videos.length === 0) {
    return (
      <Screen>
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>No videos yet</Text>
          <Text style={[styles.stateBody, { color: theme.colors.textSecondary }]}>Follow people and come back to see your personalized feed.</Text>
          <Button title="Refresh" onPress={() => loadFeed(false)} style={styles.retryButton} variant="secondary" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Title style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>For You</Title>
              {refreshing ? <ActivityIndicator color={theme.colors.accent} /> : null}
            </View>
            <Caption style={[styles.screenSubTitle, { color: theme.colors.textSecondary }]}>Fresh clips from your community</Caption>
            {error ? <Text style={[styles.inlineError, { color: theme.colors.danger }]}>{error}</Text> : null}
          </>
        }
        contentContainerStyle={styles.container}
        renderItem={({ item, index }) => (
          <VideoItem
            item={item}
            onLike={handleLike}
            isVisible={index === visibleIndex}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  skeletonWrap: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  screenSubTitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 14,
    fontWeight: '500',
  },
  inlineError: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  videoCard: {
    marginBottom: 20,
    padding: 12,
  },
  videoWrapper: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: Math.min(width * 1.05, 440),
    backgroundColor: '#0B0B0F',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  captionContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  caption: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  likeButton: {
    minWidth: 108,
  },
  heart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -32,
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 34,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 18,
    minWidth: 160,
  },
});