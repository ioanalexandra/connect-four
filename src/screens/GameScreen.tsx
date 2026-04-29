import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import ConnectFourBoard from '@/components/ConnectFourBoard';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import type { GameScreenProps } from '@/navigation/types';
import { forfeitGame, getGame, makeMove, type GameState } from '@/services/game.service';

const PLAYER_COLORS = ['', '#ef4444', '#fbbf24'];
const PLAYER_LABELS = ['', 'Red', 'Yellow'];

function AnimatedButton({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { gameId } = route.params;
  const { userId } = useAuth();
  const { socket } = useSocket();
  const [game, setGame] = useState<GameState | null>(null);
  const [moving, setMoving] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const myPlayerNumber = game?.player1.id === userId ? 1 : 2;
  const isMyTurn = game?.currentTurnId === userId;
  const isOver = game ? ['COMPLETED', 'DRAW', 'ABANDONED'].includes(game.status) : false;

  const timeLeft =
    game?.turnStartedAt && game.timeRemaining && !isOver
      ? Math.max(0, game.timeRemaining - (now - new Date(game.turnStartedAt).getTime()))
      : null;

  const timeSeconds = timeLeft !== null ? Math.ceil(timeLeft / 1000) : null;
  const isUrgent = timeSeconds !== null && timeSeconds <= 10;

  useEffect(() => {
    getGame(gameId)
      .then(data => setGame(data))
      .catch(() => {});
  }, [gameId]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (updated: GameState) => setGame(updated);
    socket.emit('game:join', { gameId });
    socket.on('game:updated', onUpdate);
    return () => {
      socket.off('game:updated', onUpdate);
      socket.emit('game:leave', { gameId });
    };
  }, [socket, gameId]);

  useEffect(() => {
    clearInterval(timerRef.current!);
    if (!game?.turnStartedAt || !game.timeRemaining || isOver) return;
    timerRef.current = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timerRef.current!);
  }, [game?.turnStartedAt, game?.timeRemaining, isOver]);

  useEffect(() => {
    if (timeLeft === 0) {
      getGame(gameId)
        .then(data => setGame(data))
        .catch(() => {});
    }
  }, [timeLeft, gameId]);

  useEffect(() => {
    if (isUrgent) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseLoopRef.current?.stop();
  }, [isUrgent, pulseAnim]);

  async function handleColumnPress(column: number) {
    if (!isMyTurn || moving || isOver) return;
    setMoving(true);
    try {
      const data = await makeMove(gameId, column);
      setGame(data);
    } catch {
      Alert.alert('Invalid move');
    } finally {
      setMoving(false);
    }
  }

  async function handleForfeit() {
    Alert.alert('Forfeit', 'Are you sure you want to forfeit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Forfeit',
        style: 'destructive',
        onPress: async () => {
          await forfeitGame(gameId).catch(() => null);
          navigation.replace('Home');
        },
      },
    ]);
  }

  if (!game) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const opponent = myPlayerNumber === 1 ? game.player2 : game.player1;
  const myLabel = PLAYER_LABELS[myPlayerNumber];
  const opponentLabel = PLAYER_LABELS[myPlayerNumber === 1 ? 2 : 1];
  const myColor = PLAYER_COLORS[myPlayerNumber];
  const opponentColor = PLAYER_COLORS[myPlayerNumber === 1 ? 2 : 1];

  function renderStatus() {
    if (game!.status === 'WAITING') return 'Waiting for opponent...';
    if (game!.status === 'DRAW') return "It's a draw!";
    if (game!.status === 'COMPLETED' || game!.status === 'ABANDONED') {
      return game!.winnerId === userId ? 'You win! 🎉' : 'You lose.';
    }
    return isMyTurn ? 'Your turn' : `${opponent?.username ?? 'Opponent'}'s turn`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.playersRow}>
        <View style={styles.playerCard}>
          <View style={[styles.colorDot, { backgroundColor: myColor }]} />
          <View>
            <Text style={styles.playerName}>You</Text>
            <Text style={styles.playerLabel}>{myLabel}</Text>
          </View>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={[styles.playerCard, styles.playerCardRight]}>
          <View>
            <Text style={[styles.playerName, { textAlign: 'right' }]}>
              {opponent?.username ?? '...'}
            </Text>
            <Text style={[styles.playerLabel, { textAlign: 'right' }]}>{opponentLabel}</Text>
          </View>
          <View style={[styles.colorDot, { backgroundColor: opponentColor }]} />
        </View>
      </View>

      <Text style={[styles.statusText, isMyTurn && !isOver && styles.myTurnText]}>
        {renderStatus()}
      </Text>

      {timeSeconds !== null && !isOver && (
        <Animated.Text
          style={[
            styles.timer,
            isUrgent && styles.timerUrgent,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {timeSeconds}s
        </Animated.Text>
      )}

      <ConnectFourBoard
        board={game.board}
        onColumnPress={handleColumnPress}
        disabled={!isMyTurn || isOver || moving}
      />

      {isOver ? (
        <View style={styles.actions}>
          <AnimatedButton
            style={styles.actionBtn}
            onPress={() => navigation.navigate('GameHistory', { gameId })}
          >
            <Text style={styles.actionText}>Watch Replay</Text>
          </AnimatedButton>
          <AnimatedButton
            style={[styles.actionBtn, styles.homeBtn]}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.actionText}>Home</Text>
          </AnimatedButton>
        </View>
      ) : (
        <AnimatedButton style={styles.forfeitBtn} onPress={handleForfeit}>
          <Text style={styles.forfeitText}>Forfeit</Text>
        </AnimatedButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: { color: '#94a3b8', fontSize: 16 },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flex: 1,
  },
  playerCardRight: { justifyContent: 'flex-end' },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  playerName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  playerLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  vs: { fontSize: 13, color: '#475569', fontWeight: '700', paddingHorizontal: 10 },
  statusText: { fontSize: 17, fontWeight: '600', color: '#94a3b8' },
  myTurnText: { color: '#818cf8' },
  timer: { fontSize: 36, fontWeight: '800', color: '#f1f5f9' },
  timerUrgent: { color: '#ef4444' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  homeBtn: { backgroundColor: '#334155' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  forfeitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  forfeitText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
});
