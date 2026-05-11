import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { ReportButtonEditor } from '@/components/features/ReportButtonEditor';
import { getGroupButtons, deactivateButton } from '@/services/supabase/reportButtons';
import { useGroupStore } from '@/store/groupStore';
import { DBReportButton } from '@/types/database';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { CONFIG } from '@/constants/config';

export default function GroupButtonsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const secondaryColor = isDark ? Colors.neutral[400] : Colors.text.secondary;
  const bg = isDark ? Colors.background.dark : Colors.background.light;

  const { activeGroupId } = useGroupStore();
  const [buttons, setButtons] = useState<DBReportButton[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editorTarget, setEditorTarget] = useState<DBReportButton | null | undefined>(undefined);
  // undefined = editor closed; null = create new; DBReportButton = edit existing

  useEffect(() => {
    if (!activeGroupId) return;
    setIsLoading(true);
    getGroupButtons(activeGroupId)
      .then(setButtons)
      .catch(() => Alert.alert(STRINGS.ERRORS.GENERIC))
      .finally(() => setIsLoading(false));
  }, [activeGroupId]);

  function handleEditorSave(saved: DBReportButton) {
    setButtons((prev) => {
      const exists = prev.some((b) => b.id === saved.id);
      return exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved];
    });
    setEditorTarget(undefined);
  }

  function handleDelete(btn: DBReportButton) {
    Alert.alert(
      STRINGS.REPORT_BUTTONS.DELETE_CONFIRM_TITLE,
      STRINGS.REPORT_BUTTONS.DELETE_CONFIRM_BODY,
      [
        { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
        {
          text: STRINGS.COMMON.DELETE,
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateButton(btn.id);
              setButtons((prev) => prev.filter((b) => b.id !== btn.id));
            } catch {
              Alert.alert(STRINGS.ERRORS.GENERIC);
            }
          },
        },
      ],
    );
  }

  const canAddMore = buttons.length < CONFIG.MAX_REPORT_BUTTONS;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.COMMON.BACK}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>
            {STRINGS.REPORT_BUTTONS.MANAGE_TITLE}
          </Text>
          <TouchableOpacity
            onPress={() => setEditorTarget(null)}
            disabled={!canAddMore}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.REPORT_BUTTONS.ADD_BUTTON}
            accessibilityState={{ disabled: !canAddMore }}
          >
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={canAddMore ? Colors.primary[500] : Colors.neutral[400]}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary[500]} style={styles.loader} />
        ) : buttons.length === 0 ? (
          <Card style={styles.empty}>
            <Ionicons name="radio-button-off-outline" size={40} color={Colors.neutral[400]} />
            <Text style={[styles.emptyText, { color: secondaryColor }]}>
              {STRINGS.REPORT_BUTTONS.NO_BUTTONS_CAPTAIN}
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {buttons.map((btn) => (
              <Card key={btn.id} style={styles.row}>
                {/* Icon */}
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name={btn.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={Colors.primary[500]}
                  />
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.buttonName, { color: textColor }]} numberOfLines={1}>
                      {btn.name}
                    </Text>
                    {btn.is_home_button && (
                      <View style={styles.homeBadge}>
                        <Ionicons name="home" size={10} color={Colors.primary[500]} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.timeInfo, { color: secondaryColor }]}>
                    {btn.activation_time.slice(0, 5)} · {btn.window_minutes} min · orden {btn.sort_order}
                  </Text>
                </View>

                {/* Actions */}
                <TouchableOpacity
                  onPress={() => setEditorTarget(btn)}
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${btn.name}`}
                >
                  <Ionicons name="pencil-outline" size={20} color={Colors.neutral[400]} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(btn)}
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${btn.name}`}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.danger.DEFAULT} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {!canAddMore && !isLoading && (
          <Text style={[styles.limitNote, { color: secondaryColor }]}>
            {STRINGS.REPORT_BUTTONS.MAX_BUTTONS_REACHED}
          </Text>
        )}
      </ScrollView>

      {/* Editor modal */}
      {editorTarget !== undefined && activeGroupId && (
        <ReportButtonEditor
          groupId={activeGroupId}
          button={editorTarget}
          onSave={handleEditorSave}
          onClose={() => setEditorTarget(undefined)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing[5], gap: Spacing[4] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  title: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  loader: { marginTop: Spacing[10] },
  empty: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[8] },
  emptyText: { fontSize: Typography.size.base, textAlign: 'center' },
  list: { gap: Spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: Spacing[1] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  buttonName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  homeBadge: {
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInfo: { fontSize: Typography.size.xs },
  actionBtn: { padding: Spacing[1] },
  limitNote: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
    marginTop: Spacing[2],
  },
});
