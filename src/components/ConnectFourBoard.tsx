import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { COLS, ROWS } from '@/utils/connectFour';

type Props = {
  board: number[][];
  onColumnPress?: (column: number) => void;
  disabled?: boolean;
};

type DroppingPiece = { col: number; row: number; player: number };

const PIECE_COLORS = ['#1e3a5f', '#ef4444', '#fbbf24'];

export default function ConnectFourBoard({ board, onColumnPress, disabled }: Props) {
  const { width } = useWindowDimensions();
  const cellSize = (width - 32) / COLS;

  const prevBoardRef = useRef<number[][]>(board);
  const [dropAnim] = useState(() => new Animated.Value(0));
  const [droppingPiece, setDroppingPiece] = useState<DroppingPiece | null>(null);

  useEffect(() => {
    const prev = prevBoardRef.current;
    let found: DroppingPiece | null = null;

    outer: for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (prev[r][c] === 0 && board[r][c] !== 0) {
          found = { col: c, row: r, player: board[r][c] };
          break outer;
        }
      }
    }
    prevBoardRef.current = board;

    if (!found) return;

    dropAnim.setValue(-found.row * cellSize);
    setDroppingPiece(found);

    Animated.spring(dropAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start(() => setDroppingPiece(null));
  }, [board, dropAnim, cellSize]);

  return (
    <View style={[styles.board, { padding: cellSize * 0.1 }]}>
      <View style={styles.columns}>
        {Array.from({ length: COLS }, (_, col) => (
          <TouchableOpacity
            key={col}
            activeOpacity={disabled ? 1 : 0.75}
            onPress={() => !disabled && onColumnPress?.(col)}
            style={{ width: cellSize }}
          >
            {Array.from({ length: ROWS }, (_, row) => {
              const isDropping =
                droppingPiece && col === droppingPiece.col && row === droppingPiece.row;
              return (
                <View
                  key={row}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize, padding: cellSize * 0.08 },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.piece,
                      { backgroundColor: PIECE_COLORS[board[row][col]] },
                      isDropping && { transform: [{ translateY: dropAnim }] },
                    ]}
                  />
                </View>
              );
            })}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  columns: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  piece: {
    flex: 1,
    width: '100%',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
