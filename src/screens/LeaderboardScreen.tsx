import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, View } from 'react-native';
import { getLeaderboard, type LeaderboardEntry } from '@/services/leaderboard.service';

const MEDALS = ['🥇', '🥈', '🥉'];

function LeaderboardRow({ item, index }: { item: LeaderboardEntry; index: number }) {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 60,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const isTop3 = item.rank <= 3;

  return (
    <Animated.View
      style={[
        styles.row,
        isTop3 && styles.topRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.rank}>{MEDALS[item.rank - 1] ?? `#${item.rank}`}</Text>
      <Text style={styles.username}>{item.username}</Text>
      <View style={styles.stats}>
        <View style={[styles.statBadge, styles.winBadge]}>
          <Text style={[styles.stat, styles.win]}>{item.wins}W</Text>
        </View>
        <View style={[styles.statBadge, styles.lossBadge]}>
          <Text style={[styles.stat, styles.loss]}>{item.losses}L</Text>
        </View>
        <View style={[styles.statBadge, styles.drawBadge]}>
          <Text style={[styles.stat, styles.draw]}>{item.draws}D</Text>
        </View>
        <Text style={styles.winRate}>{item.winRate}%</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={item => item.id}
      renderItem={({ item, index }) => <LeaderboardRow item={item} index={index} />}
      contentContainerStyle={styles.list}
      style={styles.flatList}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerRank}>#</Text>
          <Text style={styles.headerName}>Player</Text>
          <Text style={styles.headerStats}>W / L / D / Win%</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.empty}>No players yet. Be the first!</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  flatList: { backgroundColor: '#0f172a' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  list: { padding: 16, gap: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  headerRank: {
    width: 44,
    fontWeight: '700',
    color: '#475569',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  headerName: {
    flex: 1,
    fontWeight: '700',
    color: '#475569',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  headerStats: { fontWeight: '700', color: '#475569', fontSize: 12, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topRow: { borderColor: '#6366f1', borderWidth: 1.5 },
  rank: { width: 44, fontSize: 20, textAlign: 'center' },
  username: { flex: 1, fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  stats: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  statBadge: { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 6 },
  winBadge: { backgroundColor: '#22c55e22' },
  lossBadge: { backgroundColor: '#ef444422' },
  drawBadge: { backgroundColor: '#f59e0b22' },
  stat: { fontSize: 12, fontWeight: '700' },
  win: { color: '#22c55e' },
  loss: { color: '#ef4444' },
  draw: { color: '#f59e0b' },
  winRate: {
    fontSize: 13,
    fontWeight: '800',
    color: '#818cf8',
    minWidth: 40,
    textAlign: 'right',
  },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  empty: { color: '#64748b', fontSize: 16 },
});
