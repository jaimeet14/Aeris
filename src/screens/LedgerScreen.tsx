import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ledgerBalance } from '../domain/balance';
import { currencyByCode, DEFAULT_CURRENCY_CODE } from '../domain/currency';
import type { Entry } from '../domain/entry';
import { formatMoney, formatSignedMoney } from '../domain/money';
import { getSetting, listEntries, listOccasions } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Button, Heading, Initials, Label, Rule } from '../ui/atoms';
import { color, moneyTone, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Ledger'>;

export default function LedgerScreen({ navigation, route }: Props) {
  const { ledgerId, name } = route.params;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [code, setCode] = useState(DEFAULT_CURRENCY_CODE);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [rows, occasions, saved] = await Promise.all([
          listEntries(ledgerId),
          listOccasions(),
          getSetting('currency'),
        ]);
        if (!alive) return;
        setEntries(rows);
        setLabels(Object.fromEntries(occasions.map((o) => [o.id, o.label])));
        setCode(saved ?? DEFAULT_CURRENCY_CODE);
      })();
      return () => {
        alive = false;
      };
    }, [ledgerId]),
  );

  const currency = currencyByCode(code);
  const balance = ledgerBalance(entries);
  const heading =
    balance === 0 ? 'All settled' : balance > 0 ? `${name} owes you` : `You owe ${name}`;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.panel}>
          <Initials name={name} size={56} />
          <Label>{heading}</Label>
          <Text style={[styles.balance, { color: balance === 0 ? color.ink : moneyTone(balance) }]}>
            {formatMoney(Math.abs(balance), currency)}
          </Text>
          <Text style={styles.count}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Text>
          <View style={styles.actions}>
            <Button
              title="Settle up"
              variant="secondary"
              style={styles.action}
              onPress={() => navigation.navigate('SettleUp', { ledgerId, name })}
            />
            <Button
              title="Add entry"
              style={styles.action}
              onPress={() => navigation.navigate('AddEntry', { ledgerId, name })}
            />
          </View>
        </View>

        <View style={styles.list}>
          <Heading>History</Heading>
          {entries.length === 0 ? (
            <Text style={styles.empty}>Nothing recorded with {name} yet.</Text>
          ) : (
            <View style={styles.card}>
              {entries.map((entry, index) => {
                const when = new Date(entry.occurredAt);
                const signed = entry.direction === 'lent' ? entry.amountMinor : -entry.amountMinor;
                return (
                  <View key={entry.id}>
                    {index > 0 && <Rule inset={space.lg + 44 + space.md} />}
                    <View style={styles.entry}>
                      <View style={styles.date}>
                        <Text style={styles.dateDay}>{String(when.getDate()).padStart(2, '0')}</Text>
                        <Text style={styles.dateMonth}>
                          {when.toLocaleString(undefined, { month: 'short' })}
                        </Text>
                      </View>
                      <View style={styles.entryBody}>
                        <View style={styles.entryTop}>
                          <Text style={styles.entryTitle} numberOfLines={1}>
                            {entry.settlesEntryId
                              ? 'Repayment'
                              : entry.note || (entry.occasionId ? labels[entry.occasionId] : null) || 'Entry'}
                          </Text>
                          <Text style={[styles.entryAmount, { color: moneyTone(signed) }]}>
                            {formatSignedMoney(signed, currency)}
                          </Text>
                        </View>
                        <Text style={styles.entryMeta}>
                          {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} ·{' '}
                          {entry.direction === 'lent' ? 'You lent' : 'You borrowed'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.lg },
  body: { gap: space.xxl, paddingVertical: space.lg, paddingBottom: space.xxl },
  panel: { backgroundColor: color.panel, borderRadius: radius.lg, padding: space.xl, gap: space.sm, alignItems: 'center' },
  balance: { ...type.display },
  count: { ...type.small, color: color.dim, marginBottom: space.sm },
  actions: { flexDirection: 'row', gap: space.md, alignSelf: 'stretch' },
  action: { flex: 1, height: 50 },
  list: { gap: space.md },
  card: { backgroundColor: color.panel, borderRadius: radius.lg, overflow: 'hidden' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  date: { width: 44, height: 48, borderRadius: radius.sm, backgroundColor: color.raised, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: color.ink, fontSize: 16, fontWeight: '700' },
  dateMonth: { color: color.muted, fontSize: 11, fontWeight: '600' },
  entryBody: { flex: 1, gap: 3 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  entryTitle: { ...type.bodyStrong, color: color.ink, flexShrink: 1 },
  entryAmount: { ...type.amount },
  entryMeta: { ...type.small, color: color.muted },
  empty: { ...type.small, color: color.dim, paddingVertical: space.lg, textAlign: 'center' },
});
