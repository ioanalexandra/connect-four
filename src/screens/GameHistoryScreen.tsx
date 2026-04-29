import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import ConnectFourBoard from '@/components/ConnectFourBoard';
import type { GameHistoryScreenProps } from '@/navigation/types';
import { getHistory, type GameState, type Move } from '@/services/game.service';
import { dropPiece, emptyBoard, type Board } from '@/utils/connectFour';

function buildBoardAtStep(moves: Move[], step: number): Board {
  let board = emptyBoard();
  for (let i = 0; i < step; i++) {
    const move = moves[i];
    const playerNumber = i % 2 === 0 ? 1 : 2;
    const result = dropPiece(board, move.column, playerNumber as 1 | 2);
    if (result) board = result.board;
  }
  return board;
}

function ControlBtn({
  onPress,
  disabled,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  return (
    <Pressable
      onPressIn={() =>
        !disabled &&
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, tension: 200 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()
      }
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View
        style={[styles.controlBtn, disabled && styles.controlDisabled, { transform: [{ scale }] }]}
      >
        <Text style={styles.controlText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function GameHistoryScreen({ route }: GameHistoryScreenProps) {
  const { gameId } = route.params;
  const [game, setGame] = useState<GameState | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory(gameId)
      .then(({ game: g, moves: m }) => {
        setGame(g);
        setMoves(m);
        setStep(m.length);
      })
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Game not found.</Text>
      </View>
    );
  }

  const board = buildBoardAtStep(moves, step);
  const currentMove = step > 0 ? moves[step - 1] : null;
  const resultText =
    game.status === 'DRAW'
      ? "It's a draw"
      : game.winner
        ? `${game.winner.username} won`
        : game.status === 'ABANDONED'
          ? 'Game abandoned'
          : '';

  return (
    <View style={styles.container}>
      <View style={styles.players}>
        <View style={styles.playerTag}>
          <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.playerName}>{game.player1.username}</Text>
        </View>
        <Text style={styles.playerVs}>vs</Text>
        <View style={styles.playerTag}>
          <View style={[styles.dot, { backgroundColor: '#fbbf24' }]} />
          <Text style={styles.playerName}>{game.player2?.username ?? '?'}</Text>
        </View>
      </View>

      {resultText ? (
        <View style={styles.resultChip}>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>
      ) : null}

      <ConnectFourBoard board={board} disabled />

      <View style={styles.stepInfo}>
        <Text style={styles.stepText}>
          Move <Text style={styles.stepCount}>{step}</Text> of {moves.length}
        </Text>
        {currentMove && (
          <Text style={styles.moveDetail}>
            {currentMove.player.username} → col {currentMove.column + 1}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <ControlBtn onPress={() => setStep(0)} disabled={step === 0} label="⏮" />
        <ControlBtn
          onPress={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          label="◀"
        />
        <ControlBtn
          onPress={() => setStep(s => Math.min(moves.length, s + 1))}
          disabled={step === moves.length}
          label="▶"
        />
        <ControlBtn
          onPress={() => setStep(moves.length)}
          disabled={step === moves.length}
          label="⏭"
        />
      </View>
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
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  notFound: { color: '#94a3b8', fontSize: 16 },
  players: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  playerTag: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  playerName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  playerVs: { fontSize: 13, color: '#475569', fontWeight: '600' },
  resultChip: {
    backgroundColor: '#6366f122',
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  resultText: { color: '#818cf8', fontWeight: '700', fontSize: 14 },
  stepInfo: { alignItems: 'center', gap: 4 },
  stepText: { fontSize: 15, color: '#94a3b8', fontWeight: '500' },
  stepCount: { color: '#f1f5f9', fontWeight: '700' },
  moveDetail: { fontSize: 13, color: '#64748b' },
  controls: { flexDirection: 'row', gap: 12 },
  controlBtn: {
    backgroundColor: '#1e293b',
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  controlDisabled: { opacity: 0.3 },
  controlText: { fontSize: 18, color: '#f1f5f9' },
});
