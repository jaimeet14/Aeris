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
import { Button, Initials, Label } from '../ui/atoms';
import { Mark } from '../ui/Mark';
import { color, space, type } from '../theme/tokens';

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
  const tilt = net.netMinor === 0 ? 0 : net.netMinor > 0 ? -8 : 8;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Mark size={22} tint={color.amber} tilt={tilt} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add entry"
          onPress={() => navigation.navigate('AddEntry', {})}
          style={styles.plus}
        >
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <Label>Net position</Label>
          <Text style={[styles.net, empty && { color: color.faint }]}>
            {formatSignedMoney(net.netMinor, currency)}
          </Text>
          <View style={styles.split}>
            <View style={styles.splitHalf}>
              <Label>Owed to you</Label>
              <Text style={styles.splitValue}>{formatMoney(net.owedToYouMinor, currency)}</Text>
            </View>
            <View style={styles.splitRule} />
            <View style={styles.splitHalf}>
              <Label>You owe</Label>
              <Text style={[styles.splitValue, { color: color.amber }]}>
                {formatMoney(net.youOweMinor, currency)}
              </Text>
            </View>
          </View>
        </View>

        {empty ? (
          <View style={styles.emptyState}>
            <Mark size={40} tint={color.rule} />
            <Text style={styles.emptyTitle}>No one owes you a thing</Text>
            <Text style={styles.emptyBlurb}>
              Next time you cover a bill or lend a friend cash, put it here before you forget the
              reason.
            </Text>
            <Button title="Record the first one" onPress={() => navigation.navigate('AddEntry', {})} />
          </View>
        ) : (
          <View style={styles.people}>
            <Label>People</Label>
            {people.map((person) => (
              <Pressable
                key={person.ledgerId}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('Ledger', { ledgerId: person.ledgerId, name: person.name })
                }
                style={styles.person}
              >
                <Initials name={person.name} />
                <View style={styles.personBody}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personMeta}>
                    {person.balanceMinor === 0 ? 'All settled' : 'Open'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.personAmount,
                    person.balanceMinor < 0 && { color: color.amber },
                    person.balanceMinor === 0 && { color: color.dim },
                  ]}
                >
                  {person.balanceMinor === 0
                    ? 'settled'
                    : formatSignedMoney(person.balanceMinor, currencyByCode(person.currency))}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.md },
  plus: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  plusText: { color: color.muted, fontSize: 26, fontWeight: '300' },
  body: { paddingBottom: space.xxl, gap: space.xxl },
  hero: { backgroundColor: color.panel, borderWidth: 1, borderColor: color.rule, padding: space.lg, gap: space.lg },
  net: { ...type.display, color: color.ink },
  split: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: color.rule, paddingTop: space.md },
  splitHalf: { flex: 1, gap: space.xs },
  splitRule: { width: 1, backgroundColor: color.rule, marginHorizontal: space.lg },
  splitValue: { fontSize: 18, fontWeight: '600', color: color.ink },
  people: { gap: space.md },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: color.ruleSoft, minHeight: 44 },
  personBody: { flex: 1, gap: 3 },
  personName: { ...type.bodyStrong, color: color.ink },
  personMeta: { ...type.label, color: color.dim },
  personAmount: { ...type.amount, color: color.ink },
  emptyState: { alignItems: 'center', gap: space.lg, paddingVertical: space.xxl },
  emptyTitle: { fontSize: 19, fontWeight: '600', color: color.ink },
  emptyBlurb: { ...type.small, color: color.muted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});
