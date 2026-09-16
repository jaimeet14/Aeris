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
import { Button, Label } from '../ui/atoms';
import { color, space, type } from '../theme/tokens';

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
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Label>{heading}</Label>
            <Label tone="amber">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Label>
          </View>
          <Text style={styles.balance}>{formatMoney(Math.abs(balance), currency)}</Text>
          <View style={styles.actions}>
            <Button
              title="Settle up"
              variant="outline"
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
          <Label>History</Label>
          {entries.map((entry) => {
            const when = new Date(entry.occurredAt);
            const signed = entry.direction === 'lent' ? entry.amountMinor : -entry.amountMinor;
            return (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.date}>
                  <Text style={styles.dateDay}>{String(when.getDate()).padStart(2, '0')}</Text>
                  <Text style={styles.dateMonth}>
                    {when.toLocaleString(undefined, { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.entryBody}>
                  <View style={styles.entryTop}>
                    <Text style={styles.entryTitle}>
                      {entry.settlesEntryId
                        ? 'Repayment'
                        : entry.note || (entry.occasionId ? labels[entry.occasionId] : null) || 'Entry'}
                    </Text>
                    <Text style={[styles.entryAmount, signed < 0 && { color: color.amber }]}>
                      {formatSignedMoney(signed, currency)}
                    </Text>
                  </View>
                  <Text style={styles.entryMeta}>
                    {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} ·{' '}
                    {entry.direction === 'lent' ? 'you lent' : 'you borrowed'}
                  </Text>
                </View>
              </View>
            );
          })}
          {entries.length === 0 && (
            <Text style={styles.empty}>Nothing recorded with {name} yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  body: { gap: space.xl, paddingVertical: space.lg, paddingBottom: space.xxl },
  panel: { backgroundColor: color.panel, borderWidth: 1, borderColor: color.rule, padding: space.lg, gap: space.lg },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { ...type.display, color: color.ink },
  actions: { flexDirection: 'row', gap: space.md },
  action: { flex: 1, height: 46 },
  list: { gap: space.md },
  entry: { flexDirection: 'row', gap: space.md, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: color.ruleSoft },
  date: { width: 38, height: 44, borderWidth: 1, borderColor: color.rule, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: color.ink, fontSize: 14, fontWeight: '600' },
  dateMonth: { ...type.label, color: color.muted, fontSize: 8 },
  entryBody: { flex: 1, gap: space.xs },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  entryTitle: { ...type.bodyStrong, color: color.ink, flexShrink: 1 },
  entryAmount: { ...type.amount, color: color.ink },
  entryMeta: { ...type.label, color: color.muted },
  empty: { ...type.small, color: color.dim, paddingVertical: space.lg },
});
