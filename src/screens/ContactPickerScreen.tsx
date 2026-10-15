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
import { IconButton, Initials } from '../ui/atoms';
import { color, radius, space, type } from '../theme/tokens';

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
        <IconButton glyph="✕" label="Close" onPress={navigation.goBack} />
        <Text style={styles.headerTitle}>Contacts</Text>
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
        <ActivityIndicator color={color.accent} style={styles.loading} />
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
            <Pressable
              accessibilityRole="button"
              onPress={() => pick(item)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.panel }]}
            >
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
  screen: { flex: 1, backgroundColor: color.ground, paddingHorizontal: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.md },
  headerTitle: { ...type.heading, color: color.ink },
  close: { width: 44, height: 44 },
  search: {
    color: color.ink,
    ...type.body,
    backgroundColor: color.panel,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    height: 48,
    marginBottom: space.md,
  },
  loading: { marginTop: space.xxl },
  message: { ...type.small, color: color.muted, textAlign: 'center', marginTop: space.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.sm, borderRadius: radius.md, minHeight: 60 },
  rowBody: { flex: 1, gap: 2 },
  name: { ...type.bodyStrong, color: color.ink },
  phone: { ...type.small, color: color.dim },
});
