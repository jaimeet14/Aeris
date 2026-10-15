import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { requestContactsAccess } from '../contacts/device';
import type { RootStackParamList } from '../navigation/types';
import { Button, Label } from '../ui/atoms';
import { Mark } from '../ui/Mark';
import { color, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactsPriming'>;

const PROMISES = [
  'Your contacts stay on this phone',
  'Aeris reads names and numbers, nothing else',
  'Nothing is uploaded — there is no server',
] as const;

/**
 * S3. Shown before the system dialog, because a refused dialog is permanent on
 * most phones. Skipping is a first-class answer: typing a name still works.
 */
export default function ContactsPrimingScreen({ navigation }: Props) {
  const [asking, setAsking] = useState(false);

  async function allow() {
    setAsking(true);
    try {
      const access = await requestContactsAccess();
      if (access === 'granted') navigation.replace('ContactPicker');
      else navigation.goBack();
    } finally {
      setAsking(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Mark size={56} />
        <Text style={styles.title}>Pick people you already know</Text>
        <Text style={styles.blurb}>
          Choose a name from your contacts instead of typing it, so the same friend is always the
          same ledger.
        </Text>
        <View style={styles.promises}>
          {PROMISES.map((line) => (
            <View key={line} style={styles.promise}>
              <View style={styles.tickDot}>
                <Text style={styles.tick}>✓</Text>
              </View>
              <Text style={styles.promiseText}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={asking ? 'Asking' : 'Allow contacts'} onPress={allow} disabled={asking} />
        <Pressable accessibilityRole="button" onPress={navigation.goBack} style={styles.skip}>
          <Label>Not now — I'll type names</Label>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  body: { flex: 1, justifyContent: 'center', gap: space.lg },
  title: { ...type.title, color: color.ink },
  blurb: { ...type.body, color: color.muted, lineHeight: 23 },
  promises: { backgroundColor: color.panel, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  promise: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  tickDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.accentWash, alignItems: 'center', justifyContent: 'center' },
  tick: { color: color.accent, fontSize: 13, fontWeight: '700' },
  promiseText: { ...type.body, fontSize: 15, color: color.inkSoft, flex: 1 },
  footer: { paddingVertical: space.lg, gap: space.sm },
  skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
