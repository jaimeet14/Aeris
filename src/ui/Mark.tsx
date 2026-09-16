import { View, type ViewStyle } from 'react-native';
import { color } from '../theme/tokens';

/**
 * The Aeris mark, drawn with views so it needs no SVG dependency: a balance
 * beam through an A. `tilt` leans the beam the way the balance leans.
 */
export function Mark({
  size = 24,
  tint = color.ink,
  tilt = 0,
}: {
  size?: number;
  tint?: string;
  tilt?: number;
}) {
  const stroke = Math.max(1.5, size * 0.075);
  const leg: ViewStyle = {
    position: 'absolute',
    width: stroke,
    height: size * 0.64,
    backgroundColor: tint,
    borderRadius: stroke / 2,
    top: size * 0.16,
  };
  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="Aeris">
      <View style={[leg, { left: size * 0.34, transform: [{ rotate: '22deg' }] }]} />
      <View style={[leg, { left: size * 0.58, transform: [{ rotate: '-22deg' }] }]} />
      <View
        style={{
          position: 'absolute',
          top: size * 0.52,
          left: size * 0.1,
          width: size * 0.8,
          height: stroke,
          backgroundColor: tint,
          borderRadius: stroke / 2,
          transform: [{ rotate: `${tilt}deg` }],
        }}
      />
    </View>
  );
}
