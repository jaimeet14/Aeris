import { View } from 'react-native';
import { color } from '../theme/tokens';

/**
 * The Aeris mark from the app icon: two ledger lines on a mint tile, each a
 * bar and a coin, passing in opposite directions. Drawn with views so it
 * needs no SVG dependency. `tile={false}` draws the glyph alone in `tint`.
 */
export function Mark({
  size = 28,
  tint = color.accentInk,
  tile = true,
}: {
  size?: number;
  tint?: string;
  tile?: boolean;
}) {
  // The glyph is 560 x 320 units, centred in a 1024-unit tile.
  const unit = (tile ? size * 0.62 : size) / 560;
  const bar = 120 * unit;
  const parts = [
    { left: 0, top: 0, width: 360 },
    { left: 440, top: 0, width: 120 },
    { left: 200, top: 200, width: 360 },
    { left: 0, top: 200, width: 120 },
  ];
  const glyph = (
    <View style={{ width: 560 * unit, height: 320 * unit }}>
      {parts.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: p.left * unit,
            top: p.top * unit,
            width: p.width * unit,
            height: bar,
            borderRadius: bar / 2,
            backgroundColor: tint,
          }}
        />
      ))}
    </View>
  );
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Aeris"
      style={{
        width: size,
        height: tile ? size : 320 * unit,
        borderRadius: tile ? size * 0.28 : 0,
        backgroundColor: tile ? color.accent : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph}
    </View>
  );
}
