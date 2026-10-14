import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { currencyByCode, DEFAULT_CURRENCY_CODE } from '../domain/currency';
import type { Direction } from '../domain/entry';
import { parseAmount } from '../domain/money';
import { MAX_OCCASION_LABEL, type Occasion } from '../domain/occasions';
import { contactsAccess } from '../contacts/device';
import { addEntry, createOccasion, findOrCreatePerson, getSetting, listOccasions } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Button, Choice, Label } from '../ui/atoms';
import { color, space, type } from '../theme/tokens';

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
      setCode((await getSetting('currency')) ?? DEFAULT_CURRENCY_CODE);
    })();
  }, []);

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
      const ledgerId =
        route.params?.ledgerId ?? (await findOrCreatePerson(who, currency.code, phoneE164)).ledgerId;
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
        <Pressable accessibilityRole="button" onPress={navigation.goBack} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Label>New entry</Label>
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

        <View style={styles.amountPanel}>
          <Label>Amount</Label>
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
                <Pressable accessibilityRole="button" onPress={openContacts} style={styles.contactsButton}>
                  <Label tone="amber">Contacts</Label>
                </Pressable>
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
                  <Pressable
                    key={occasion.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setOccasionId(on ? null : occasion.id)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{occasion.label}</Text>
                  </Pressable>
                );
              })}
              {newOccasion === null && (
                <Pressable accessibilityRole="button" onPress={() => setNewOccasion('')} style={styles.chip}>
                  <Text style={styles.chipText}>+ New</Text>
                </Pressable>
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
                <Pressable accessibilityRole="button" onPress={addOccasion} style={styles.contactsButton}>
                  <Label tone="amber">Add</Label>
                </Pressable>
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
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.md },
  close: { width: 44, height: 44, justifyContent: 'center' },
  closeText: { color: color.ink, fontSize: 18 },
  body: { gap: space.lg, paddingBottom: space.lg },
  amountPanel: { backgroundColor: color.panel, borderWidth: 1, borderColor: color.rule, padding: space.lg, gap: space.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  symbol: { color: color.dim, fontSize: 26, fontWeight: '500' },
  amountInput: { flex: 1, color: color.ink, fontSize: 46, fontWeight: '600', padding: 0 },
  fields: { borderWidth: 1, borderColor: color.rule },
  field: { padding: space.md, gap: space.sm },
  divided: { borderTopWidth: 1, borderTopColor: color.ruleSoft },
  input: { color: color.ink, ...type.body, padding: 0, minHeight: 24 },
  readonly: { color: color.inkSoft, ...type.body },
  whoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  whoInput: { flex: 1 },
  contactsButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  phone: { ...type.small, color: color.dim },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 1, borderColor: color.rule, paddingVertical: 7, paddingHorizontal: 11 },
  chipOn: { backgroundColor: color.amber, borderColor: color.amber },
  chipText: { color: color.muted, fontSize: 11, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' },
  chipTextOn: { color: color.amberInk, fontWeight: '600' },
  footer: { paddingVertical: space.lg },
});
