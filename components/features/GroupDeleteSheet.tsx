import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroup } from '@/hooks/useGroup';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import type { GroupWithRole } from '@/types';

interface GroupDeleteSheetProps {
  visible: boolean;
  onClose: () => void;
}

type Stage = 'select' | 'confirm';

export function GroupDeleteSheet({ visible, onClose }: GroupDeleteSheetProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { groups, remove } = useGroup();

  const [stage, setStage] = useState<Stage>('select');
  const [selected, setSelected] = useState<GroupWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const captainGroups = groups.filter((g) => g.role === 'captain');

  useEffect(() => {
    if (!visible) {
      setStage('select');
      setSelected(null);
      setDeleteError('');
    }
  }, [visible]);

  const bg = isDark ? Colors.surface.dark : Colors.surface.light;
  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const borderColor = isDark ? Colors.neutral[800] : Colors.neutral[200];

  function handleSelectGroup(group: GroupWithRole) {
    setSelected(group);
    setDeleteError('');
    setStage('confirm');
  }

  function handleBack() {
    setStage('select');
    setSelected(null);
    setDeleteError('');
  }

  async function handleConfirmDelete() {
    if (!selected) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await remove(selected.id);
      onClose();
    } catch {
      setDeleteError(STRINGS.ERRORS.GENERIC);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: bg }]}>
              <View style={[styles.handle, { backgroundColor: isDark ? Colors.neutral[600] : Colors.neutral[300] }]} />

              {stage === 'select' ? (
                <SelectStage
                  captainGroups={captainGroups}
                  textColor={textColor}
                  borderColor={borderColor}
                  isDark={isDark}
                  onSelect={handleSelectGroup}
                />
              ) : (
                <ConfirmStage
                  group={selected!}
                  textColor={textColor}
                  isDark={isDark}
                  isDeleting={isDeleting}
                  error={deleteError}
                  onBack={handleBack}
                  onConfirm={handleConfirmDelete}
                  onCancel={onClose}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ── Etapa 1: selección ─────────────────────────────── */

interface SelectStageProps {
  captainGroups: GroupWithRole[];
  textColor: string;
  borderColor: string;
  isDark: boolean;
  onSelect: (group: GroupWithRole) => void;
}

function SelectStage({ captainGroups, textColor, borderColor, isDark, onSelect }: SelectStageProps) {
  return (
    <>
      <View style={styles.stageHeader}>
        <View style={[styles.dangerIconCircle, { backgroundColor: Colors.danger.light }]}>
          <Ionicons name="trash-outline" size={24} color={Colors.danger.DEFAULT} />
        </View>
        <View style={styles.stageTitleBlock}>
          <Text style={[styles.stageTitle, { color: textColor }]}>Eliminar grupo</Text>
          <Text style={styles.stageSubtitle}>
            {captainGroups.length === 0
              ? 'No tienes grupos para eliminar'
              : 'Elige el grupo que deseas eliminar'}
          </Text>
        </View>
      </View>

      {captainGroups.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Ionicons name="information-circle-outline" size={32} color={Colors.neutral[400]} />
          <Text style={[styles.emptyText, { color: Colors.text.secondary }]}>
            Solo los admins pueden eliminar grupos. No eres admin en ningún grupo actualmente.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} bounces={false} showsVerticalScrollIndicator={false}>
          {captainGroups.map((g) => (
            <TouchableOpacity
              key={g.id}
              onPress={() => onSelect(g)}
              accessibilityRole="button"
              accessibilityLabel={`Seleccionar ${g.name} para eliminar`}
              style={[styles.groupRow, { borderColor }]}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[100] }]}>
                <Text style={[styles.avatarText, { color: Colors.text.secondary }]}>
                  {g.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={styles.memberCount}>
                  {g.memberCount} miembro{g.memberCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.danger.DEFAULT} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
}

/* ── Etapa 2: confirmación ──────────────────────────── */

interface ConfirmStageProps {
  group: GroupWithRole;
  textColor: string;
  isDark: boolean;
  isDeleting: boolean;
  error: string;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmStage({ group, textColor, isDark, isDeleting, error, onBack, onConfirm, onCancel }: ConfirmStageProps) {
  return (
    <>
      {/* Back */}
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Volver a selección"
        style={styles.backBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={Colors.text.secondary} />
        <Text style={styles.backLabel}>Volver</Text>
      </TouchableOpacity>

      {/* Danger card */}
      <View style={[styles.dangerCard, { backgroundColor: Colors.danger.light }]}>
        <Ionicons name="warning" size={28} color={Colors.danger.DEFAULT} />
        <View style={styles.dangerCardText}>
          <Text style={[styles.dangerCardTitle, { color: Colors.danger.dark }]}>
            ¿Eliminar "{group.name}"?
          </Text>
          <Text style={[styles.dangerCardBody, { color: Colors.danger.dark }]}>
            Esta acción eliminará todos los datos del grupo, incluyendo miembros y reportes. No se puede deshacer.
          </Text>
        </View>
      </View>

      {/* Group summary */}
      <View style={[styles.groupSummary, { backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[100] }]}>
        <View style={[styles.avatar, { backgroundColor: Colors.danger.DEFAULT }]}>
          <Text style={[styles.avatarText, { color: Colors.text.inverse }]}>
            {group.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.memberCount}>
            {STRINGS.GROUP.CAPTAIN_BADGE} · {group.memberCount} miembro{group.memberCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {error !== '' && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Buttons */}
      <View style={styles.confirmActions}>
        <TouchableOpacity
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.COMMON.CANCEL}
          style={[styles.actionBtn, styles.cancelBtn, { borderColor: isDark ? Colors.neutral[600] : Colors.neutral[300] }]}
          activeOpacity={0.7}
          disabled={isDeleting}
        >
          <Text style={[styles.actionBtnLabel, { color: Colors.text.secondary }]}>{STRINGS.COMMON.CANCEL}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel="Confirmar eliminación"
          style={[styles.actionBtn, styles.deleteBtn]}
          activeOpacity={0.7}
          disabled={isDeleting}
        >
          {isDeleting
            ? <ActivityIndicator color={Colors.text.inverse} size="small" />
            : (
              <>
                <Ionicons name="trash" size={18} color={Colors.text.inverse} />
                <Text style={[styles.actionBtnLabel, { color: Colors.text.inverse }]}>
                  {STRINGS.COMMON.DELETE}
                </Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </>
  );
}

/* ── Estilos ────────────────────────────────────────── */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    paddingHorizontal: Spacing[5],
    maxHeight: '85%',
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },

  /* Select stage */
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  dangerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTitleBlock: { flex: 1 },
  stageTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  stageSubtitle: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginTop: 2 },

  list: { maxHeight: 320 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.lg,
    marginBottom: Spacing[2],
    borderWidth: 1.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  groupInfo: { flex: 1 },
  groupName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
  memberCount: { fontSize: Typography.size.xs, color: Colors.text.secondary, marginTop: 2 },

  emptyBlock: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  emptyText: { fontSize: Typography.size.sm, textAlign: 'center', lineHeight: 20 },

  /* Confirm stage */
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[4],
  },
  backLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary },

  dangerCard: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.lg,
    marginBottom: Spacing[4],
    alignItems: 'flex-start',
  },
  dangerCardText: { flex: 1 },
  dangerCardTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing[1],
  },
  dangerCardBody: { fontSize: Typography.size.sm, lineHeight: 20 },

  groupSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.lg,
    marginBottom: Spacing[5],
  },

  errorText: {
    color: Colors.danger.DEFAULT,
    fontSize: Typography.size.sm,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },

  confirmActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  cancelBtn: { borderWidth: 1.5 },
  deleteBtn: { backgroundColor: Colors.danger.DEFAULT },
  actionBtnLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
});
