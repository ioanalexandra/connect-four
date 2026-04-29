import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import type { MyGamesScreenProps } from '@/navigation/types';
import { getMyGames, type GameState } from '@/services/game.service';

function resultLabel(game: GameState, userId: string): { text: string; color: string } {
  if (game.status === 'DRAW') return { text: 'Draw', color: '#f59e0b' };
  if (game.status === 'ABANDONED') return { text: 'Abandoned', color: '#64748b' };
  if (game.winnerId === userId) return { text: 'Win', color: '#22c55e' };
  return { text: 'Loss', color: '#ef4444' };
}

function opponentName(game: GameState, userId: string): string {
  return game.player1.id === userId ? (game.player2?.username ?? '?') : game.player1.username;
}

function GameRow({
  item,
  index,
  userId,
  onPress,
}: {
  item: GameState;
  index: number;
  userId: string;
  onPress: () => void;
}) {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(16));
  const [scale] = useState(() => new Animated.Value(1));
  const result = resultLabel(item, userId);
  const opponent = opponentName(item, userId);
  const date = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 50,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()
        }
        onPress={onPress}
      >
        <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
          <View style={[styles.resultBadge, { backgroundColor: result.color + '22' }]}>
            <Text style={[styles.resultText, { color: result.color }]}>{result.text}</Text>
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.opponent}>vs {opponent}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function MyGamesScreen({ navigation }: MyGamesScreenProps) {
  const { userId } = useAuth();
  const [games, setGames] = useState<GameState[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMyGames()
        .then(setGames)
        .catch(() => setGames([]))
        .finally(() => setLoading(false));
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        keyExtractor={g => g.id}
        renderItem={({ item, index }) => (
          <GameRow
            item={item}
            index={index}
            userId={userId!}
            onPress={() => navigation.navigate('GameHistory', { gameId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.empty}>No completed games yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  resultBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  resultText: { fontSize: 13, fontWeight: '700' },
  rowInfo: { flex: 1, gap: 2 },
  opponent: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  date: { fontSize: 12, color: '#64748b' },
  chevron: { fontSize: 22, color: '#475569', fontWeight: '300' },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  empty: { color: '#64748b', fontSize: 16 },
});
