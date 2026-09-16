import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { TOUCH, color, radius, space, type } from '../theme/tokens';

export function Label({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'amber' }) {
  return <Text style={[styles.label, tone === 'amber' && { color: color.amber }]}>{children}</Text>;
}

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Rule() {
  return <View style={styles.rule} />;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonOutline,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, primary ? styles.buttonTextPrimary : styles.buttonTextOutline]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Choice({
  options,
  value,
  onChange,
}: {
  options: readonly { key: string; title: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((option) => {
        const on = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.key)}
            style={[styles.choice, on ? styles.choiceOn : styles.choiceOff]}
          >
            <Text style={[styles.choiceText, { color: on ? color.amber : color.muted }]}>
              {option.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View style={styles.initials}>
      <Text style={styles.initialsText}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...type.label, color: color.muted },
  panel: { backgroundColor: color.panel, borderWidth: 1, borderColor: color.rule, padding: space.lg },
  rule: { height: 1, backgroundColor: color.ruleSoft },
  button: {
    height: 54,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  buttonPrimary: { backgroundColor: color.amber },
  buttonOutline: { borderWidth: 1, borderColor: color.rule },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  buttonTextPrimary: { color: color.amberInk },
  buttonTextOutline: { color: color.inkSoft },
  choiceRow: { flexDirection: 'row', gap: space.sm },
  choice: {
    flex: 1,
    height: TOUCH,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOn: { borderColor: color.amber, backgroundColor: color.amberWash },
  choiceOff: { borderColor: color.rule },
  choiceText: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },
  initials: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: color.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { color: color.muted, fontSize: 11, fontWeight: '500' },
});
