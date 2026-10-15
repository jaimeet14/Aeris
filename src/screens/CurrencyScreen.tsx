import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { type Currency, currencyByCode, searchCurrencies, suggestCurrency } from '../domain/currency';
import { getSetting, setSetting } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Button, IconButton, Label } from '../ui/atoms';
import { color, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Currency'>;

export default function CurrencyScreen({ navigation, route }: Props) {
  const firstRun = route.params?.firstRun ?? false;
  const suggested = suggestCurrency(['en-IN']);
  const [chosen, setChosen] = useState<Currency>(suggested);
  const [query, setQuery] = useState('');
  const results = searchCurrencies(query).filter((c) => c.code !== suggested.code);

  useEffect(() => {
    if (firstRun) return;
    (async () => {
      const saved = await getSetting('currency');
      if (saved) setChosen(currencyByCode(saved));
    })();
  }, [firstRun]);

  async function confirm() {
    await setSetting('currency', chosen.code);
    if (firstRun) navigation.replace('Home');
    else navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {!firstRun && <IconButton glyph="✕" label="Close" onPress={navigation.goBack} />}
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
        <View style={[styles.group, results.length === 0 && { display: 'none' }]}>
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
      style={[styles.row, divided && styles.rowDivided, selected && styles.rowSelected, !divided && styles.rowAlone]}
    >
      <Text style={[styles.symbol, selected && { color: color.accent }]}>{currency.symbol}</Text>
      <Text style={[styles.name, selected && { color: color.ink, fontWeight: '600' }]}>
        {currency.name}
      </Text>
      <Text style={[styles.code, selected && { color: color.accent }]}>{currency.code}</Text>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.lg },
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', marginVertical: space.md },
  intro: { gap: space.sm, marginBottom: space.lg, paddingHorizontal: space.xs },
  title: { ...type.title, color: color.ink },
  blurb: { ...type.small, color: color.muted, lineHeight: 20 },
  search: {
    height: 48,
    flexShrink: 0,
    backgroundColor: color.panel,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    color: color.ink,
    ...type.body,
    marginBottom: space.lg,
  },
  list: { paddingBottom: space.lg, gap: space.sm },
  gap: { height: space.md },
  group: { backgroundColor: color.panel, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: space.lg, gap: space.md },
  rowAlone: { backgroundColor: color.panel, borderRadius: radius.lg },
  rowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.rule },
  rowSelected: { backgroundColor: color.accentWash },
  symbol: { width: 34, textAlign: 'center', color: color.muted, fontSize: 16, fontWeight: '700' },
  name: { flex: 1, color: color.inkSoft, ...type.bodyStrong, fontWeight: '500' },
  code: { ...type.label, color: color.dim },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: color.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: color.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.accent },
  footer: { gap: space.md, paddingVertical: space.md },
  footnote: { ...type.small, color: color.dim, textAlign: 'center' },
});
