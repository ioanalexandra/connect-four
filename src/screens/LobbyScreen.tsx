import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useSocket, type OnlineUser } from '@/context/SocketContext';
import type { LobbyScreenProps } from '@/navigation/types';

function OnlineDot() {
  const [pulse] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotPulse, { transform: [{ scale: pulse }] }]} />
      <View style={styles.dot} />
    </View>
  );
}

function UserRow({
  item,
  index,
  pendingChallenge,
  onChallenge,
  onCancel,
}: {
  item: OnlineUser;
  index: number;
  pendingChallenge: string | null;
  onChallenge: (u: OnlineUser) => void;
  onCancel: () => void;
}) {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));
  const [scale] = useState(() => new Animated.Value(1));
  const waiting = pendingChallenge === item.id;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
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

  return (
    <Animated.View
      style={[styles.row, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}
    >
      <OnlineDot />
      <Text style={styles.username}>{item.username}</Text>
      {waiting ? (
        <Pressable
          onPressIn={() =>
            Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 200 }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()
          }
          onPress={onCancel}
        >
          <Animated.View style={[styles.cancelBtn, { transform: [{ scale }] }]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Animated.View>
        </Pressable>
      ) : (
        <Pressable
          disabled={!!pendingChallenge}
          onPressIn={() =>
            Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 200 }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()
          }
          onPress={() => onChallenge(item)}
        >
          <Animated.View
            style={[
              styles.challengeBtn,
              pendingChallenge ? styles.btnDisabled : null,
              { transform: [{ scale }] },
            ]}
          >
            <Text style={styles.challengeText}>Challenge</Text>
          </Animated.View>
        </Pressable>
      )}
    </Animated.View>
  );
}

export default function LobbyScreen({ navigation }: LobbyScreenProps) {
  const { userId } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);

  const others = onlineUsers.filter(u => u.id !== userId);

  const handleChallenge = useCallback(
    (target: OnlineUser) => {
      socket?.emit('challenge:send', { targetUserId: target.id });
      setPendingChallenge(target.id);
    },
    [socket],
  );

  const handleCancel = useCallback(() => {
    if (pendingChallenge) {
      socket?.emit('challenge:cancel', { targetUserId: pendingChallenge });
      setPendingChallenge(null);
    }
  }, [socket, pendingChallenge]);

  useEffect(() => {
    if (!socket) return;

    const onAccepted = ({ gameId }: { gameId: string }) => {
      setPendingChallenge(null);
      navigation.replace('Game', { gameId });
    };

    const onDeclined = ({ declinedBy }: { declinedBy: string }) => {
      setPendingChallenge(null);
      Alert.alert('Challenge declined', `${declinedBy} declined your challenge.`);
    };

    socket.on('challenge:accepted', onAccepted);
    socket.on('challenge:declined', onDeclined);
    return () => {
      socket.off('challenge:accepted', onAccepted);
      socket.off('challenge:declined', onDeclined);
    };
  }, [socket, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        {others.length === 0
          ? 'No other players online right now.'
          : `${others.length} player${others.length === 1 ? '' : 's'} online`}
      </Text>
      <FlatList
        data={others}
        keyExtractor={u => u.id}
        renderItem={({ item, index }) => (
          <UserRow
            item={item}
            index={index}
            pendingChallenge={pendingChallenge}
            onChallenge={handleChallenge}
            onCancel={handleCancel}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎮</Text>
            <Text style={styles.empty}>Invite a friend to join!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  subtitle: {
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  dotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dotPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    opacity: 0.3,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  username: { flex: 1, fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  challengeBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnDisabled: { backgroundColor: '#334155' },
  challengeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  empty: { color: '#64748b', fontSize: 16 },
});
