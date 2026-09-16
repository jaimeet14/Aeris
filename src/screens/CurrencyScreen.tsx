import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { type Currency, searchCurrencies, suggestCurrency } from '../domain/currency';
import { setSetting } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Button, Label } from '../ui/atoms';
import { color, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Currency'>;

export default function CurrencyScreen({ navigation, route }: Props) {
  const firstRun = route.params?.firstRun ?? false;
  const suggested = suggestCurrency(['en-IN']);
  const [chosen, setChosen] = useState<Currency>(suggested);
  const [query, setQuery] = useState('');
  const results = searchCurrencies(query).filter((c) => c.code !== suggested.code);

  async function confirm() {
    await setSetting('currency', chosen.code);
    if (firstRun) navigation.replace('Home');
    else navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Label>Currency</Label>
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>What do you count in?</Text>
        <Text style={styles.blurb}>
          This sets the default for new ledgers. Each ledger keeps whatever it was opened in — Aeris
          never converts between currencies.
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search currencies"
        placeholderTextColor={color.dim}
        style={styles.search}
        autoCorrect={false}
      />

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {query.trim() === '' && (
          <>
            <Label>From your phone</Label>
            <Row currency={suggested} selected={chosen.code === suggested.code} onPress={setChosen} />
            <View style={styles.gap} />
            <Label>Common</Label>
          </>
        )}
        <View style={styles.group}>
          {results.map((currency, index) => (
            <Row
              key={currency.code}
              currency={currency}
              selected={chosen.code === currency.code}
              onPress={setChosen}
              divided={index > 0}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={`Use ${chosen.name}`} onPress={confirm} />
        <Text style={styles.footnote}>Change it any time under You.</Text>
      </View>
    </SafeAreaView>
  );
}

function Row({
  currency,
  selected,
  onPress,
  divided = false,
}: {
  currency: Currency;
  selected: boolean;
  onPress: (c: Currency) => void;
  divided?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onPress(currency)}
      style={[styles.row, divided && styles.rowDivided, selected && styles.rowSelected]}
    >
      <Text style={[styles.symbol, selected && { color: color.amber }]}>{currency.symbol}</Text>
      <Text style={[styles.name, selected && { color: color.ink, fontWeight: '600' }]}>
        {currency.name}
      </Text>
      <Text style={[styles.code, selected && { color: color.amber }]}>{currency.code}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  header: { alignItems: 'center', paddingVertical: space.md },
  intro: { gap: space.sm, marginBottom: space.lg },
  title: { ...type.title, color: color.ink },
  blurb: { ...type.small, color: color.muted, lineHeight: 19 },
  search: {
    height: 44,
    borderWidth: 1,
    borderColor: color.rule,
    paddingHorizontal: space.md,
    color: color.ink,
    fontSize: 13.5,
    marginBottom: space.lg,
  },
  list: { paddingBottom: space.lg, gap: space.sm },
  gap: { height: space.md },
  group: { borderWidth: 1, borderColor: color.rule },
  row: { flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: space.md, gap: space.md },
  rowDivided: { borderTopWidth: 1, borderTopColor: color.ruleSoft },
  rowSelected: { backgroundColor: color.amberWash, borderColor: color.amber, borderWidth: 1 },
  symbol: { width: 34, textAlign: 'center', color: color.muted, fontSize: 15, fontWeight: '600' },
  name: { flex: 1, color: color.inkSoft, ...type.bodyStrong },
  code: { ...type.label, color: color.dim },
  footer: { gap: space.md, paddingVertical: space.lg },
  footnote: { ...type.small, color: color.dim, textAlign: 'center' },
});
