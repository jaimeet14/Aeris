import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { readDeviceContacts } from '../contacts/device';
import { type PickableContact, searchContacts, toPickable } from '../domain/contacts';
import { DEFAULT_CURRENCY_CODE } from '../domain/currency';
import { callingCodeForCurrency } from '../domain/phone';
import { getSetting } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Initials, Label } from '../ui/atoms';
import { color, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactPicker'>;

export default function ContactPickerScreen({ navigation }: Props) {
  const [rows, setRows] = useState<PickableContact[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const currency = (await getSetting('currency')) ?? DEFAULT_CURRENCY_CODE;
        setRows(toPickable(await readDeviceContacts(), callingCodeForCurrency(currency)));
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  const visible = useMemo(() => (rows ? searchContacts(rows, query) : []), [rows, query]);

  function pick(row: PickableContact) {
    navigation.popTo('AddEntry', { name: row.name, phoneE164: row.phoneE164, pickedAt: Date.now() }, { merge: true });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={navigation.goBack} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Label>Contacts</Label>
        <View style={styles.close} />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search name or number"
        placeholderTextColor={color.dim}
        style={styles.search}
        autoFocus
        autoCorrect={false}
      />

      {failed ? (
        <Text style={styles.message}>Contacts could not be read. You can still type a name.</Text>
      ) : rows === null ? (
        <ActivityIndicator color={color.amber} style={styles.loading} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(row) => row.key}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          ListEmptyComponent={
            <Text style={styles.message}>
              {rows.length === 0 ? 'Your address book is empty.' : 'No one matches that.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => pick(item)} style={styles.row}>
              <Initials name={item.name} />
              <View style={styles.rowBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phoneE164 ?? 'No number'}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.md },
  close: { width: 44, height: 44, justifyContent: 'center' },
  closeText: { color: color.ink, fontSize: 18 },
  search: {
    color: color.ink,
    ...type.body,
    borderWidth: 1,
    borderColor: color.rule,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    marginBottom: space.md,
  },
  loading: { marginTop: space.xxl },
  message: { ...type.small, color: color.muted, textAlign: 'center', marginTop: space.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: color.ruleSoft, minHeight: 44 },
  rowBody: { flex: 1, gap: 3 },
  name: { ...type.bodyStrong, color: color.ink },
  phone: { ...type.small, color: color.dim },
});
