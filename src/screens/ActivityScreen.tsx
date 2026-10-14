import { useCallback, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  activityDetail,
  type DaySection,
  describeActivity,
  groupByDay,
  happenedEarlier,
  relativeDay,
} from '../domain/activity';
import { currencyByCode } from '../domain/currency';
import { formatSignedMoney } from '../domain/money';
import { signedAmount } from '../domain/entry';
import { type ActivityItem, listActivity } from '../db/repo';
import type { RootStackParamList } from '../navigation/types';
import { Label } from '../ui/atoms';
import { color, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Activity'>;

const time = (at: number) => new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const day = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * S9. Every entry across every person, in the order Aeris was told about it.
 * Nothing here can be edited — this is the record the append-only rule protects.
 */
export default function ActivityScreen({ navigation }: Props) {
  const [sections, setSections] = useState<DaySection<ActivityItem>[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const rows = await listActivity(500);
        if (alive) setSections(groupByDay(rows));
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const now = Date.now();

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <SectionList
        sections={sections ?? []}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.body}
        ListEmptyComponent={
          sections ? <Text style={styles.empty}>Nothing recorded yet. Every entry will appear here.</Text> : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHead}>
            <Label>{relativeDay(section.dayStart, now) ?? day(section.dayStart)}</Label>
          </View>
        )}
        renderItem={({ item }) => {
          const detail = activityDetail(item);
          const reversal = item.reversesEntryId !== null;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Ledger', { ledgerId: item.ledgerId, name: item.personName })}
              style={styles.row}
            >
              <View style={styles.rowTop}>
                <Text style={[styles.title, reversal && styles.struck]} numberOfLines={1}>
                  {describeActivity(item)}
                </Text>
                <Text style={styles.time}>{time(item.recordedAt)}</Text>
              </View>
              <View style={styles.rowTop}>
                <Text style={styles.meta} numberOfLines={1}>
                  {[detail, happenedEarlier(item) ? `happened ${day(item.occurredAt)}, ${time(item.occurredAt)}` : null]
                    .filter(Boolean)
                    .join(' · ') || ' '}
                </Text>
                <Text style={[styles.amount, signedAmount(item) < 0 && { color: color.accent }]}>
                  {formatSignedMoney(signedAmount(item), currencyByCode(item.currency))}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  body: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
  empty: { ...type.small, color: color.muted, textAlign: 'center', marginTop: space.xxl },
  dayHead: { paddingTop: space.xl, paddingBottom: space.sm },
  row: { paddingVertical: space.md, borderTopWidth: 1, borderTopColor: color.ruleSoft, gap: 4, minHeight: 44 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.md },
  title: { ...type.bodyStrong, color: color.ink, flex: 1 },
  struck: { color: color.muted },
  time: { ...type.small, color: color.dim },
  meta: { ...type.small, color: color.muted, flex: 1 },
  amount: { ...type.small, fontWeight: '600', color: color.inkSoft },
});
