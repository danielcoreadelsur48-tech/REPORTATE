import React, { useEffect } from 'react';
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
import { ReportButtonGrid } from '@/components/features/ReportButtonGrid';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useGroup } from '@/hooks/useGroup';
import { useReportButtons } from '@/hooks/useReportButtons';
import { ReportButtonWithState } from '@/types';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { user } = useAuthStore();
  const { groups, activeGroupId, setActiveGroupId, loadGroups, isLoadingGroups } = useGroup();
  const isCaptain = groups.find((g) => g.id === activeGroupId)?.role === 'captain';
  const { buttons, isLoading: buttonsLoading, error: buttonsError, load: loadButtons, press: pressButton } =
    useReportButtons(activeGroupId, isCaptain ?? false);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (activeGroupId) {
      loadButtons();
    }
  }, [activeGroupId, loadButtons]);

  async function handleButtonPress(button: ReportButtonWithState) {
    try {
      await pressButton(button);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    }
  }

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const subtextColor = Colors.text.secondary;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: subtextColor }]}>Hola,</Text>
          <Text style={[styles.name, { color: textColor }]}>{user?.full_name ?? '...'}</Text>
        </View>

        {isLoadingGroups ? null : groups.length === 0 ? (
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

            {buttons.length > 0 && (
              <Card style={styles.buttonsCard}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  {STRINGS.REPORT_BUTTONS.SECTION_TITLE}
                </Text>
                {buttonsError && (
                  <Text style={styles.errorText}>{buttonsError}</Text>
                )}
                <ReportButtonGrid
                  buttons={buttons}
                  onPress={handleButtonPress}
                  isLoading={buttonsLoading}
                />
              </Card>
            )}
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
  buttonsCard: { gap: Spacing[4] },
  cardTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  errorText: { color: Colors.danger.DEFAULT, fontSize: Typography.size.sm },
});
