import { View } from 'react-native';
import { color } from '../theme/tokens';

/**
 * The Aeris mark, the "a" from the app icon: a ring with a stem on its right.
 * Drawn with views so it needs no SVG dependency.
 */
export function Mark({ size = 24, tint = color.ink }: { size?: number; tint?: string }) {
  // Proportions of the icon's glyph: a 480-unit box, 124-unit strokes.
  const stroke = size * (124 / 480);
  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="Aeris">
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: tint,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          width: stroke,
          height: size,
          borderRadius: stroke / 2,
          backgroundColor: tint,
        }}
      />
    </View>
  );
}
