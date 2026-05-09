import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { JourneyButton } from '@/components/features/JourneyButton';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { useJourney } from '@/hooks/useJourney';
import { useGroup } from '@/hooks/useGroup';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { user } = useAuthStore();
  const { groups, activeGroupId, setActiveGroupId, loadGroups } = useGroup();
  const { hasStarted, hasEnded, todayStart, isLoading, error, loadReports, startJourney, endJourney } =
    useJourney(activeGroupId);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (activeGroupId) loadReports();
  }, [activeGroupId]);

  async function handleStart() {
    try {
      await startJourney();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    }
  }

  async function handleEnd() {
    try {
      await endJourney();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    }
  }

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const subtextColor = Colors.text.secondary;

  const journeyState = hasEnded ? 'ended' : hasStarted ? 'started' : 'idle';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: subtextColor }]}>Hola,</Text>
          <Text style={[styles.name, { color: textColor }]}>{user?.full_name ?? '...'}</Text>
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={STRINGS.HOME.NO_GROUP}
            description={STRINGS.HOME.NO_GROUP_ACTION}
          />
        ) : (
          <>
            {groups.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupPicker}>
                {groups.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setActiveGroupId(g.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar grupo ${g.name}`}
                    style={[
                      styles.groupChip,
                      activeGroupId === g.id && styles.groupChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupChipText,
                        activeGroupId === g.id && styles.groupChipTextActive,
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Card style={styles.journeyCard}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{STRINGS.HOME.TITLE}</Text>
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
              <JourneyButton
                state={journeyState}
                startedAt={todayStart?.created_at}
                isLoading={isLoading}
                onStartPress={handleStart}
                onEndPress={handleEnd}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing[5], gap: Spacing[5], flexGrow: 1 },
  greeting: { marginBottom: Spacing[2] },
  hello: { fontSize: Typography.size.base },
  name: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold },
  groupPicker: { flexGrow: 0, marginBottom: Spacing[2] },
  groupChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    marginRight: Spacing[2],
  },
  groupChipActive: { backgroundColor: Colors.primary[500] },
  groupChipText: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: '600' },
  groupChipTextActive: { color: Colors.text.inverse },
  journeyCard: { gap: Spacing[4] },
  cardTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  errorText: { color: Colors.danger.DEFAULT, fontSize: Typography.size.sm },
});
