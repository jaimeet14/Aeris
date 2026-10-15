import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { TOUCH, color, radius, space, type } from '../theme/tokens';

export function Label({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' }) {
  return <Text style={[styles.label, tone === 'accent' && { color: color.accent }]}>{children}</Text>;
}

/** A section title above a card or list. */
export function Heading({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.headingRow}>
      <Text style={styles.heading}>{children}</Text>
      {right}
    </View>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Rule({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.rule, { marginLeft: inset }]} />;
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
  variant?: 'primary' | 'secondary';
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
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? color.accentInk : color.ink }]}>{title}</Text>
    </Pressable>
  );
}

/** A small round button for close, back and other single-glyph actions. */
export function IconButton({
  glyph,
  label,
  onPress,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
    >
      <Text style={styles.iconGlyph}>{glyph}</Text>
    </Pressable>
  );
}

/** A tappable pill, used for header links and occasion chips. */
export function Pill({
  title,
  onPress,
  selected = false,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.pill, selected && styles.pillOn, pressed && styles.buttonPressed]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextOn]}>{title}</Text>
    </Pressable>
  );
}

/** A segmented control: one track, the chosen segment raised. */
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
    <View style={styles.choiceTrack} accessibilityRole="radiogroup">
      {options.map((option) => {
        const on = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.key)}
            style={[styles.choice, on && styles.choiceOn]}
          >
            <Text style={[styles.choiceText, { color: on ? color.ink : color.muted }]}>{option.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const AVATAR_TINTS = ['#C6F432', '#7AA7FF', '#FFB86B', '#FF7A9C', '#B69CFF', '#5ED3F3', '#F5D547'] as const;

function tintFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length] ?? color.accent;
}

export function Initials({ name, size = 42 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const tint = tintFor(name.trim().toLowerCase());
  return (
    <View
      style={[
        styles.initials,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${tint}26` },
      ]}
    >
      <Text style={[styles.initialsText, { color: tint, fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...type.label, color: color.muted },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xs },
  heading: { ...type.heading, color: color.ink },
  panel: { backgroundColor: color.panel, borderRadius: radius.lg, padding: space.lg },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.rule },
  button: {
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  buttonPrimary: { backgroundColor: color.accent },
  buttonSecondary: { backgroundColor: color.raised },
  buttonDisabled: { opacity: 0.35 },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  buttonText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.1 },
  iconButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    backgroundColor: color.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { color: color.ink, fontSize: 17, fontWeight: '600' },
  pill: {
    minHeight: 36,
    borderRadius: radius.pill,
    backgroundColor: color.raised,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: color.accent },
  pillText: { color: color.inkSoft, fontSize: 14, fontWeight: '600' },
  pillTextOn: { color: color.accentInk },
  choiceTrack: { flexDirection: 'row', backgroundColor: color.panel, borderRadius: radius.pill, padding: 4 },
  choice: {
    flex: 1,
    height: TOUCH,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOn: { backgroundColor: color.raised },
  choiceText: { fontSize: 15, fontWeight: '600' },
  initials: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontWeight: '700' },
});
