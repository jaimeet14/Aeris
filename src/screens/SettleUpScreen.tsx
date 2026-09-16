import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { allocateOldestFirst, totalOutstanding } from '../domain/allocation';
import { ledgerBalance, openDebts, remainingOnDebt } from '../domain/balance';
import { currencyByCode, DEFAULT_CURRENCY_CODE } from '../domain/currency';
import type { Entry } from '../domain/entry';
import { formatMoney, parseAmount } from '../domain/money';
import { addEntry, getSetting, listEntries } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Button, Choice, Label } from '../ui/atoms';
import { color, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SettleUp'>;

export default function SettleUpScreen({ navigation, route }: Props) {
  const { ledgerId, name } = route.params;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<'part' | 'full'>('part');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState(DEFAULT_CURRENCY_CODE);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [rows, saved] = await Promise.all([listEntries(ledgerId), getSetting('currency')]);
        if (!alive) return;
        setEntries(rows);
        setCode(saved ?? DEFAULT_CURRENCY_CODE);
      })();
      return () => {
        alive = false;
      };
    }, [ledgerId]),
  );

  const currency = currencyByCode(code);
  const balance = ledgerBalance(entries);
  // A repayment moves the balance toward zero, so it runs against the side that owes.
  const owingDirection = balance >= 0 ? 'lent' : 'borrowed';
  const debts = openDebts(entries, owingDirection);
  const outstanding = totalOutstanding(debts, entries);

  let paymentMinor = 0;
  let parseError: string | null = null;
  try {
    paymentMinor = mode === 'full' ? outstanding : parseAmount(amount, currency);
  } catch (error) {
    parseError = error instanceof Error ? error.message : 'Not a valid amount';
  }

  const plan = parseError ? null : allocateOldestFirst(debts, entries, paymentMinor);
  const applied = plan ? paymentMinor - plan.unappliedMinor : 0;
  const after = balance >= 0 ? balance - applied : balance + applied;
  const ready = !parseError && paymentMinor > 0 && !saving;

  async function record() {
    if (!plan) return;
    setSaving(true);
    try {
      if (plan.unappliedMinor > 0) {
        throw new Error(
          `Only ${formatMoney(outstanding, currency)} is outstanding. Lower the amount, or record the extra as a new entry.`,
        );
      }
      for (const allocation of plan.allocations) {
        await addEntry({
          ledgerId,
          direction: owingDirection === 'lent' ? 'borrowed' : 'lent',
          amountMinor: allocation.appliedMinor,
          occasionId: null,
          note: 'Repayment',
          occurredAt: Date.now(),
          settlesEntryId: allocation.entryId,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('That did not save', error instanceof Error ? error.message : 'Unknown problem');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Label>Settle up</Label>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <Label>{balance >= 0 ? `${name} owes you` : `You owe ${name}`}</Label>
          <Text style={styles.outstanding}>{formatMoney(Math.abs(balance), currency)}</Text>
        </View>

        <Choice
          options={[
            { key: 'part', title: 'Part payment' },
            { key: 'full', title: 'In full' },
          ]}
          value={mode}
          onChange={(key) => setMode(key as 'part' | 'full')}
        />

        <View style={styles.amountPanel}>
          <Label>{balance >= 0 ? `${name} pays` : 'You pay'}</Label>
          <View style={styles.amountRow}>
            <Text style={styles.symbol}>{currency.symbol}</Text>
            {mode === 'full' ? (
              <Text style={styles.amountStatic}>{formatMoney(outstanding, currency).slice(currency.symbol.length)}</Text>
            ) : (
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={color.faint}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                autoFocus
              />
            )}
          </View>
        </View>

        <View style={styles.plan}>
          <Label>Applied to</Label>
          {plan && plan.allocations.length > 0 ? (
            plan.allocations.map((allocation) => {
              const debt = debts.find((d) => d.id === allocation.entryId);
              const remaining = debt ? remainingOnDebt(debt, entries) : 0;
              return (
                <View key={allocation.entryId} style={styles.planRow}>
                  <Text style={styles.planLabel}>{debt?.note || 'Earlier entry'}</Text>
                  <Text style={styles.planValue}>
                    {formatMoney(allocation.appliedMinor, currency)} / {formatMoney(remaining, currency)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.hint}>
              {outstanding === 0 ? 'Nothing outstanding to settle.' : 'Enter an amount.'}
            </Text>
          )}
          <Text style={styles.hint}>Oldest debt first.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={saving ? 'Saving' : 'Record repayment'} onPress={record} disabled={!ready} />
        <View style={styles.after}>
          <Label>Balance after</Label>
          <Text style={styles.afterValue}>{formatMoney(Math.abs(after), currency)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  header: { alignItems: 'center', paddingVertical: space.md },
  body: { gap: space.lg, paddingBottom: space.lg },
  summary: { gap: space.sm },
  outstanding: { fontSize: 24, fontWeight: '600', color: color.ink },
  amountPanel: { backgroundColor: color.panel, borderWidth: 1, borderColor: color.rule, padding: space.lg, gap: space.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  symbol: { color: color.dim, fontSize: 26, fontWeight: '500' },
  amountInput: { flex: 1, color: color.ink, fontSize: 46, fontWeight: '600', padding: 0 },
  amountStatic: { flex: 1, color: color.ink, fontSize: 46, fontWeight: '600' },
  plan: { borderWidth: 1, borderColor: color.rule, padding: space.md, gap: space.md },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  planLabel: { ...type.bodyStrong, color: color.ink, flexShrink: 1 },
  planValue: { ...type.small, color: color.muted },
  hint: { ...type.small, color: color.dim },
  footer: { gap: space.md, paddingVertical: space.lg },
  after: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', gap: space.sm },
  afterValue: { fontSize: 15, fontWeight: '600', color: color.ink },
});
