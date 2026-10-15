import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { currencyByCode, DEFAULT_CURRENCY_CODE } from '../domain/currency';
import type { Direction } from '../domain/entry';
import { parseAmount } from '../domain/money';
import { MAX_OCCASION_LABEL, type Occasion } from '../domain/occasions';
import { contactsAccess } from '../contacts/device';
import {
  addEntry,
  createOccasion,
  findOrCreatePerson,
  getLedgerCurrency,
  getSetting,
  listOccasions,
} from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Button, Choice, IconButton, Label, Pill } from '../ui/atoms';
import { color, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

export default function AddEntryScreen({ navigation, route }: Props) {
  const [direction, setDirection] = useState<Direction>('lent');
  const [amount, setAmount] = useState('');
  const [who, setWho] = useState(route.params?.name ?? '');
  const [phoneE164, setPhoneE164] = useState<string | null>(route.params?.phoneE164 ?? null);
  const [note, setNote] = useState('');
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [occasionId, setOccasionId] = useState<string | null>(null);
  const [code, setCode] = useState(DEFAULT_CURRENCY_CODE);
  const [saving, setSaving] = useState(false);
  const [newOccasion, setNewOccasion] = useState<string | null>(null);
  const fixedPerson = route.params?.ledgerId !== undefined;

  useEffect(() => {
    (async () => {
      setOccasions(await listOccasions());
      const ledgerId = route.params?.ledgerId;
      const ledgerCurrency = ledgerId ? await getLedgerCurrency(ledgerId) : null;
      setCode(ledgerCurrency ?? (await getSetting('currency')) ?? DEFAULT_CURRENCY_CODE);
    })();
  }, [route.params?.ledgerId]);

  // The contact picker hands its choice back through these params.
  const pickedName = route.params?.name;
  const pickedPhone = route.params?.phoneE164;
  const pickedAt = route.params?.pickedAt;
  useEffect(() => {
    if (fixedPerson || pickedName === undefined) return;
    setWho(pickedName);
    setPhoneE164(pickedPhone ?? null);
  }, [fixedPerson, pickedName, pickedPhone, pickedAt]);

  function typeWho(text: string) {
    setWho(text);
    // A typed name is no longer the contact that was picked.
    setPhoneE164(null);
  }

  async function openContacts() {
    const access = await contactsAccess();
    if (access === 'granted') navigation.navigate('ContactPicker');
    else if (access === 'ask') navigation.navigate('ContactsPriming');
    else {
      Alert.alert('Contacts are turned off', 'Allow Aeris to read contacts in Settings, or type a name.', [
        { text: 'Type a name', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
    }
  }

  async function addOccasion() {
    try {
      const occasion = await createOccasion(newOccasion ?? '');
      setOccasions(await listOccasions());
      setOccasionId(occasion.id);
      setNewOccasion(null);
    } catch (error) {
      Alert.alert('That occasion did not save', error instanceof Error ? error.message : 'Unknown problem');
    }
  }

  const currency = currencyByCode(code);
  const ready = who.trim() !== '' && amount.trim() !== '' && !saving;

  async function save() {
    setSaving(true);
    try {
      const amountMinor = parseAmount(amount, currency);
      if (amountMinor <= 0) throw new Error('Enter an amount greater than zero');
      let ledgerId = route.params?.ledgerId;
      if (ledgerId === undefined) {
        const person = await findOrCreatePerson(who, currency.code, phoneE164);
        // A name that matches someone already known lands in their ledger, which
        // keeps its own currency. Switch to it and let the amount be checked.
        if (person.currency !== currency.code) {
          const theirs = currencyByCode(person.currency);
          setCode(theirs.code);
          Alert.alert(
            `${person.name} is kept in ${theirs.name}`,
            `Their ledger never converts currencies. Check the amount in ${theirs.symbol} and save again.`,
          );
          return;
        }
        ledgerId = person.ledgerId;
      }
      await addEntry({
        ledgerId,
        direction,
        amountMinor,
        occasionId,
        note,
        occurredAt: Date.now(),
      });
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
        <IconButton glyph="✕" label="Close" onPress={navigation.goBack} />
        <Text style={styles.headerTitle}>New entry</Text>
        <View style={styles.close} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Choice
          options={[
            { key: 'lent', title: 'I lent' },
            { key: 'borrowed', title: 'I borrowed' },
          ]}
          value={direction}
          onChange={(key) => setDirection(key as Direction)}
        />

        <View style={[styles.amountPanel, { borderColor: direction === 'lent' ? color.accentRule : color.oweRule }]}>
          <Label>{direction === 'lent' ? 'You lent' : 'You borrowed'}</Label>
          <View style={styles.amountRow}>
            <Text style={styles.symbol}>{currency.symbol}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={color.faint}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Label>Who</Label>
            <View style={styles.whoRow}>
              <TextInput
                value={who}
                onChangeText={typeWho}
                editable={!fixedPerson}
                placeholder="Their name"
                placeholderTextColor={color.dim}
                style={[styles.input, styles.whoInput]}
              />
              {!fixedPerson && (
                <Pill title="Contacts" onPress={openContacts} />
              )}
            </View>
            {phoneE164 && <Text style={styles.phone}>{phoneE164}</Text>}
          </View>

          <View style={[styles.field, styles.divided]}>
            <Label>Occasion</Label>
            <View style={styles.chips}>
              {occasions.map((occasion) => {
                const on = occasion.id === occasionId;
                return (
                  <Pill
                    key={occasion.id}
                    title={occasion.label}
                    selected={on}
                    onPress={() => setOccasionId(on ? null : occasion.id)}
                  />
                );
              })}
              {newOccasion === null && (
                <Pill title="+ New" onPress={() => setNewOccasion('')} />
              )}
            </View>
            {newOccasion !== null && (
              <View style={styles.whoRow}>
                <TextInput
                  value={newOccasion}
                  onChangeText={setNewOccasion}
                  onSubmitEditing={addOccasion}
                  placeholder="Goa trip, Gym, Gift…"
                  placeholderTextColor={color.dim}
                  maxLength={MAX_OCCASION_LABEL}
                  returnKeyType="done"
                  style={[styles.input, styles.whoInput]}
                  autoFocus
                />
                <Pill title="Add" selected onPress={addOccasion} />
                <Pressable accessibilityRole="button" onPress={() => setNewOccasion(null)} style={styles.contactsButton}>
                  <Label>Cancel</Label>
                </Pressable>
              </View>
            )}
          </View>

          <View style={[styles.field, styles.divided]}>
            <Label>Note</Label>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was it for?"
              placeholderTextColor={color.dim}
              style={styles.input}
            />
          </View>

          <View style={[styles.field, styles.divided]}>
            <Label>When</Label>
            <Text style={styles.readonly}>
              Now · {new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={saving ? 'Saving' : 'Save entry'} onPress={save} disabled={!ready} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.md },
  headerTitle: { ...type.heading, color: color.ink },
  close: { width: 44, height: 44 },
  body: { gap: space.lg, paddingBottom: space.lg },
  amountPanel: {
    backgroundColor: color.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    gap: space.sm,
    alignItems: 'center',
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, maxWidth: '100%' },
  symbol: { color: color.muted, fontSize: 30, fontWeight: '600' },
  amountInput: { minWidth: 60, flexShrink: 1, color: color.ink, fontSize: 48, fontWeight: '700', padding: 0, textAlign: 'center' },
  fields: { backgroundColor: color.panel, borderRadius: radius.lg, overflow: 'hidden' },
  field: { paddingVertical: space.md, paddingHorizontal: space.lg, gap: space.sm },
  divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.rule },
  input: { color: color.ink, ...type.body, padding: 0, minHeight: 28 },
  readonly: { color: color.inkSoft, ...type.body },
  whoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  whoInput: { flex: 1, minWidth: 0 },
  contactsButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  phone: { ...type.small, color: color.dim },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footer: { paddingVertical: space.md },
});
