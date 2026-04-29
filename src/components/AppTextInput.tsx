import { useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type AppTextInputProps = TextInputProps & {
  placeholder: string;
  label?: string;
};

export default function AppTextInput({ placeholder, label, style, ...props }: AppTextInputProps) {
  const [focused, setFocused] = useState(false);
  const [borderAnim] = useState(() => new Animated.Value(0));

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    props.onFocus?.({} as never);
  };

  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    props.onBlur?.({} as never);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#334155', '#6366f1'],
  });

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[styles.container, { borderColor }, focused && styles.focusedContainer]}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          style={[styles.input, style]}
          {...props}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.5 },
  container: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
  },
  focusedContainer: {
    backgroundColor: '#1e2d40',
  },
  input: {
    fontSize: 16,
    color: '#f1f5f9',
  },
});
