import { useCallback, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import type { HomeScreenProps } from '@/navigation/types';
import { getActiveGame, type GameState } from '@/services/game.service';

function AnimatedButton({
  onPress,
  style,
  textStyle,
  label,
  entrance,
}: {
  onPress: () => void;
  style?: object;
  textStyle?: object;
  label: string;
  entrance: Animated.Value;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  return (
    <Animated.View
      style={[
        { width: '100%' },
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()
        }
        onPress={onPress}
      >
        <Animated.View style={[styles.button, style, { transform: [{ scale }] }]}>
          <Text style={[styles.buttonText, textStyle]}>{label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { logout } = useAuth();
  const [activeGame, setActiveGame] = useState<GameState | null>(null);

  const [titleAnim] = useState(() => new Animated.Value(0));
  const [btn1] = useState(() => new Animated.Value(0));
  const [btn2] = useState(() => new Animated.Value(0));
  const [btn3] = useState(() => new Animated.Value(0));
  const [btn4] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      getActiveGame()
        .then(setActiveGame)
        .catch(() => setActiveGame(null));

      [titleAnim, btn1, btn2, btn3, btn4].forEach(a => a.setValue(0));
      Animated.stagger(80, [
        Animated.spring(titleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.spring(btn1, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.spring(btn2, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.spring(btn3, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.spring(btn4, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      ]).start();
    }, [titleAnim, btn1, btn2, btn3, btn4]),
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.titleBlock,
          {
            opacity: titleAnim,
            transform: [
              {
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.dots}>⬤ ⬤ ⬤ ⬤</Text>
        <Text style={styles.title}>Connect Four</Text>
        <Text style={styles.subtitle}>Challenge a player to a match</Text>
      </Animated.View>

      <View style={styles.buttons}>
        {activeGame ? (
          <AnimatedButton
            entrance={btn1}
            style={styles.resumeButton}
            label="Resume Game"
            onPress={() => navigation.navigate('Game', { gameId: activeGame.id })}
          />
        ) : (
          <AnimatedButton
            entrance={btn1}
            style={styles.playButton}
            label="Play"
            onPress={() => navigation.navigate('Lobby')}
          />
        )}

        <AnimatedButton
          entrance={btn2}
          style={styles.secondaryButton}
          textStyle={styles.secondaryText}
          label="My Games"
          onPress={() => navigation.navigate('MyGames')}
        />

        <AnimatedButton
          entrance={btn3}
          style={styles.secondaryButton}
          textStyle={styles.secondaryText}
          label="Leaderboard"
          onPress={() => navigation.navigate('Leaderboard')}
        />

        <AnimatedButton
          entrance={btn4}
          style={styles.logoutButton}
          textStyle={styles.logoutText}
          label="Log Out"
          onPress={logout}
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
    paddingHorizontal: 24,
    gap: 48,
  },
  titleBlock: { alignItems: 'center', gap: 8 },
  dots: { fontSize: 20, color: '#6366f1', letterSpacing: 6, marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '900', color: '#f1f5f9', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#94a3b8' },
  buttons: { width: '100%', gap: 12 },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: { backgroundColor: '#6366f1' },
  resumeButton: { backgroundColor: '#22c55e' },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryText: { color: '#f1f5f9', fontWeight: '600', fontSize: 16 },
  logoutText: { color: '#475569', fontWeight: '600', fontSize: 15 },
});
