import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { netPosition } from '../domain/balance';
import { currencyByCode, DEFAULT_CURRENCY_CODE } from '../domain/currency';
import { formatMoney, formatSignedMoney } from '../domain/money';
import { getSetting, listPeople, type Person } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Button, Heading, Initials, Label, Pill, Rule } from '../ui/atoms';
import { Mark } from '../ui/Mark';
import { color, moneyTone, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [code, setCode] = useState(DEFAULT_CURRENCY_CODE);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [rows, saved] = await Promise.all([listPeople(), getSetting('currency')]);
        if (!alive) return;
        setPeople(rows);
        setCode(saved ?? DEFAULT_CURRENCY_CODE);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const currency = currencyByCode(code);
  const net = netPosition(people.map((p) => p.balanceMinor));
  const empty = people.length === 0;

  const netTone = empty ? color.faint : moneyTone(net.netMinor);
  const netCaption =
    net.netMinor > 0 ? 'Overall, you are owed' : net.netMinor < 0 ? 'Overall, you owe' : 'You are all square';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Mark size={30} />
          <Text style={styles.wordmark}>Aeris</Text>
        </View>
        <View style={styles.headerLinks}>
          <Pill title="Activity" onPress={() => navigation.navigate('Activity')} />
          <Pill
            title={code}
            accessibilityLabel={`Default currency ${code}. Change`}
            onPress={() => navigation.navigate('Currency', {})}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <Label>{netCaption}</Label>
          <Text style={[styles.net, { color: netTone }]} adjustsFontSizeToFit numberOfLines={1}>
            {formatSignedMoney(net.netMinor, currency)}
          </Text>
          <View style={styles.split}>
            <View style={[styles.stat, { backgroundColor: color.gainWash }]}>
              <View style={styles.statHead}>
                <View style={[styles.statDot, { backgroundColor: color.gain }]} />
                <Label>Owed to you</Label>
              </View>
              <Text style={[styles.statValue, { color: color.gain }]}>
                {formatMoney(net.owedToYouMinor, currency)}
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: color.oweWash }]}>
              <View style={styles.statHead}>
                <View style={[styles.statDot, { backgroundColor: color.owe }]} />
                <Label>You owe</Label>
              </View>
              <Text style={[styles.statValue, { color: color.owe }]}>
                {formatMoney(net.youOweMinor, currency)}
              </Text>
            </View>
          </View>
        </View>

        {empty ? (
          <View style={styles.emptyState}>
            <Mark size={56} />
            <Text style={styles.emptyTitle}>No one owes you a thing</Text>
            <Text style={styles.emptyBlurb}>
              Next time you cover a bill or lend a friend cash, put it here before you forget the
              reason.
            </Text>
          </View>
        ) : (
          <View style={styles.people}>
            <Heading>People</Heading>
            <View style={styles.card}>
              {people.map((person, index) => (
                <View key={person.ledgerId}>
                  {index > 0 && <Rule inset={space.lg + 42 + space.md} />}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      navigation.navigate('Ledger', { ledgerId: person.ledgerId, name: person.name })
                    }
                    style={({ pressed }) => [styles.person, pressed && { backgroundColor: color.raised }]}
                  >
                    <Initials name={person.name} />
                    <View style={styles.personBody}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {person.name}
                      </Text>
                      <Text style={styles.personMeta}>
                        {person.balanceMinor === 0
                          ? 'All settled'
                          : person.balanceMinor > 0
                            ? 'Owes you'
                            : 'You owe'}
                      </Text>
                    </View>
                    <Text style={[styles.personAmount, { color: moneyTone(person.balanceMinor) }]}>
                      {person.balanceMinor === 0
                        ? 'Settled'
                        : formatMoney(Math.abs(person.balanceMinor), currencyByCode(person.currency))}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.dock} pointerEvents="box-none">
        <Button
          title={empty ? 'Record the first one' : '+  New entry'}
          onPress={() => navigation.navigate('AddEntry', {})}
          style={styles.dockButton}
        />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  wordmark: { ...type.heading, fontSize: 20, fontWeight: '700', color: color.ink },
  headerLinks: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  body: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 120, gap: space.xxl },
  hero: { backgroundColor: color.panel, borderRadius: radius.lg, padding: space.xl, gap: space.md },
  net: { ...type.display, marginBottom: space.sm },
  split: { flexDirection: 'row', gap: space.md },
  stat: { flex: 1, borderRadius: radius.md, padding: space.md, gap: space.sm },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statValue: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  people: { gap: space.md },
  card: { backgroundColor: color.panel, borderRadius: radius.lg, overflow: 'hidden' },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    minHeight: 68,
  },
  personBody: { flex: 1, gap: 2 },
  personName: { ...type.bodyStrong, color: color.ink },
  personMeta: { ...type.small, color: color.muted },
  personAmount: { ...type.amount },
  chevron: { color: color.dim, fontSize: 22, marginLeft: -2 },
  emptyState: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  emptyTitle: { ...type.heading, fontSize: 20, color: color.ink, marginTop: space.sm },
  emptyBlurb: { ...type.small, color: color.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg },
  dockButton: {
    marginBottom: space.md,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
