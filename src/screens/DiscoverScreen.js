// src/screens/DiscoverScreen.js
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { followUser, getDiscoverUsers } from '../services/backendApi';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Body, Caption, Title } from '../components/ui/Typography';
import { useTheme } from '../theme/ThemeProvider';

function MatchItem({ item, onPress }) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const score = Math.min(Math.round(item.activity_score || 0), 100);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withTiming(1.02, { duration: 120 }, () => {
      scale.value = withTiming(1, { duration: 160 });
    });
    onPress(item);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Card style={styles.matchItem}>
        <Body style={[styles.matchName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Body>
        <Caption style={[styles.matchHandle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          @{item.username}
        </Caption>

        <View style={[styles.relevanceChip, { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border }]}>
          <Text style={[styles.relevanceText, { color: theme.colors.accent }]}>Relevance {score}%</Text>
        </View>

        <Caption style={[styles.matchSkills, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {item.skills?.length ? item.skills.join(', ') : 'No skills listed'}
        </Caption>

        <Button
          title="Follow"
          onPress={handlePress}
          variant="secondary"
          style={styles.followButton}
        />
      </Card>
    </Animated.View>
  );
}

function DiscoverSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton width="65%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="45%" height={14} style={{ marginBottom: 10 }} />
      <Skeleton width="60%" height={24} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="90%" height={14} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={46} />
    </View>
  );
}

export default function DiscoverScreen() {
  const theme = useTheme();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const result = await getDiscoverUsers(20);
      setMatches(result.users || []);
    } catch (error) {
      setError(error?.message || 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMatchPress = async (match) => {
    try {
      await followUser(match.id);
      setMatches((prev) => prev.filter((user) => user.id !== match.id));
    } catch (error) {
      setError(error?.message || 'Failed to follow user');
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.container}>
          <Title style={[styles.title, { color: theme.colors.textPrimary }]}>Discover</Title>
          <Caption style={[styles.subtitle, { color: theme.colors.textSecondary }]}>People and creators aligned with your interests</Caption>
          <View style={styles.skeletonGrid}>
            <DiscoverSkeleton />
            <DiscoverSkeleton />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.container}
        renderItem={({ item }) => <MatchItem item={item} onPress={handleMatchPress} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View>
                <Title style={[styles.title, { color: theme.colors.textPrimary }]}>Discover</Title>
                <Caption style={[styles.subtitle, { color: theme.colors.textSecondary }]}>People and creators aligned with your interests</Caption>
              </View>
              {refreshing ? <ActivityIndicator color={theme.colors.accent} /> : null}
            </View>

            {error ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text> : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No suggestions right now</Text>
            <Text style={[styles.emptyBody, { color: theme.colors.textSecondary }]}>Try refreshing to get new people to connect with.</Text>
          </View>
        }
        ListFooterComponent={
          <Button
            title="Refresh suggestions"
            onPress={() => loadMatches(true)}
            variant="secondary"
            style={styles.refreshButton}
            loading={refreshing}
          />
        }
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
  skeletonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  skeletonCard: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  matchItem: {
    width: '48.5%',
    padding: 14,
    minHeight: 206,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
  },
  matchHandle: {
    fontSize: 14,
    marginTop: 4,
  },
  relevanceChip: {
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchSkills: {
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
    minHeight: 36,
  },
  followButton: {
    marginTop: 20,
  },
  refreshButton: {
    marginTop: 8,
    marginBottom: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
});