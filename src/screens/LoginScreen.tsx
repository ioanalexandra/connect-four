import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppTextInput from '@/components/AppTextInput';
import { useAuth } from '@/context/AuthContext';
import type { LoginScreenProps } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function AnimatedButton({
  onPress,
  disabled,
  children,
}: {
  onPress: () => void;
  disabled: boolean;
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
      disabled={disabled}
      style={{ width: '100%' }}
    >
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(40));

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
      ]).start();
    }, [fadeAnim, slideAnim]),
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
    } catch {
      Alert.alert('Login failed', 'Invalid email or password.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>⬤⬤⬤⬤</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Email"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

          <AnimatedButton onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </AnimatedButton>

          <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.linkText}>
              Don&apos;t have an account? <Text style={styles.linkAccent}>Register</Text>
            </Text>
          </Pressable>
        </View>
      </Animated.View>
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
  },
  content: { width: '100%', gap: 32 },
  header: { alignItems: 'center', gap: 8 },
  logo: { fontSize: 24, color: '#6366f1', letterSpacing: 4, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#f1f5f9' },
  subtitle: { fontSize: 15, color: '#94a3b8' },
  form: { gap: 12 },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#f87171', fontSize: 12, marginTop: -4 },
  linkRow: { alignItems: 'center', paddingVertical: 4 },
  linkText: { color: '#94a3b8', fontSize: 14 },
  linkAccent: { color: '#818cf8', fontWeight: '600' },
});
