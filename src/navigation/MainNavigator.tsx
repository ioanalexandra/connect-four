import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSocket } from '@/context/SocketContext';
import { acceptChallenge } from '@/services/game.service';
import GameHistoryScreen from '@/screens/GameHistoryScreen';
import GameScreen from '@/screens/GameScreen';
import HomeScreen from '@/screens/HomeScreen';
import LeaderboardScreen from '@/screens/LeaderboardScreen';
import LobbyScreen from '@/screens/LobbyScreen';
import MyGamesScreen from '@/screens/MyGamesScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

function ChallengeHandler() {
  const { incomingChallenge, clearChallenge, socket } = useSocket();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const handleChallenge = useCallback(() => {
    if (!incomingChallenge) return;
    Alert.alert('Game Challenge!', `${incomingChallenge.challengerUsername} wants to play!`, [
      {
        text: 'Decline',
        style: 'cancel',
        onPress: () => {
          socket?.emit('challenge:decline', { challengerId: incomingChallenge.challengerId });
          clearChallenge();
        },
      },
      {
        text: 'Accept',
        onPress: async () => {
          clearChallenge();
          try {
            const game = await acceptChallenge(incomingChallenge.challengerId);
            navigation.navigate('Game', { gameId: game.id });
          } catch {
            Alert.alert('Error', 'Could not start the game.');
          }
        },
      },
    ]);
  }, [incomingChallenge, clearChallenge, socket, navigation]);

  useEffect(() => {
    handleChallenge();
  }, [handleChallenge]);

  return null;
}

export default function MainNavigator() {
  return (
    <>
      <ChallengeHandler />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f1f5f9',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Find Opponent' }} />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ title: 'Game', headerBackVisible: false }}
        />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: 'Leaderboard' }}
        />
        <Stack.Screen
          name="GameHistory"
          component={GameHistoryScreen}
          options={{ title: 'Replay' }}
        />
        <Stack.Screen name="MyGames" component={MyGamesScreen} options={{ title: 'My Games' }} />
      </Stack.Navigator>
    </>
  );
}
