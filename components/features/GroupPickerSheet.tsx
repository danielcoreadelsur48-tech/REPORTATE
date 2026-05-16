import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { useGroup } from '@/hooks/useGroup';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import type { GroupWithRole } from '@/types';

interface GroupPickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function GroupPickerSheet({ visible, onClose }: GroupPickerSheetProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { groups, activeGroupId, setActiveGroupId } = useGroup();

  const bg = isDark ? Colors.surface.dark : Colors.surface.light;
  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const borderColor = isDark ? Colors.neutral[800] : Colors.neutral[200];

  function handleSelect(group: GroupWithRole) {
    setActiveGroupId(group.id);
    onClose();
  }

  function handleCreate() {
    onClose();
    router.push('/(app)/group/create');
  }

  function handleJoin() {
    onClose();
    router.push('/(app)/group/join');
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

              <Text style={[styles.title, { color: textColor }]}>Mis grupos</Text>

              <ScrollView style={styles.list} bounces={false} showsVerticalScrollIndicator={false}>
                {groups.map((g) => {
                  const isActive = g.id === activeGroupId;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => handleSelect(g)}
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar grupo ${g.name}`}
                      style={[
                        styles.groupRow,
                        { borderColor },
                        isActive && { backgroundColor: Colors.primary[50], borderColor: Colors.primary[500] },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.avatar,
                        { backgroundColor: isActive ? Colors.primary[500] : isDark ? Colors.neutral[700] : Colors.neutral[200] },
                      ]}>
                        <Text style={[
                          styles.avatarText,
                          { color: isActive ? Colors.text.inverse : Colors.text.secondary },
                        ]}>
                          {g.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.groupInfo}>
                        <Text style={[styles.groupName, { color: isActive ? Colors.primary[700] : textColor }]} numberOfLines={1}>
                          {g.name}
                        </Text>
                        <View style={styles.groupMeta}>
                          <Badge
                            label={g.role === 'captain' ? STRINGS.GROUP.CAPTAIN_BADGE : 'Miembro'}
                            variant={g.role === 'captain' ? 'primary' : 'neutral'}
                          />
                          <Text style={styles.memberCount}>
                            {g.memberCount} miembro{g.memberCount !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>

                      {isActive
                        ? <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                        : <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
                      }
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <TouchableOpacity
                onPress={handleCreate}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.GROUP.CREATE_GROUP}
                style={styles.actionRow}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.primary[50] }]}>
                  <Ionicons name="add" size={20} color={Colors.primary[500]} />
                </View>
                <Text style={[styles.actionLabel, { color: Colors.primary[500] }]}>
                  {STRINGS.GROUP.CREATE_GROUP}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleJoin}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.GROUP.JOIN_GROUP}
                style={styles.actionRow}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[100] }]}>
                  <Ionicons name="key-outline" size={20} color={Colors.text.secondary} />
                </View>
                <Text style={[styles.actionLabel, { color: textColor }]}>
                  {STRINGS.GROUP.JOIN_GROUP}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    paddingHorizontal: Spacing[5],
    maxHeight: '82%',
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing[3],
  },
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
  avatarText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  groupInfo: { flex: 1, gap: Spacing[1] },
  groupName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  memberCount: { fontSize: Typography.size.xs, color: Colors.text.secondary },
  divider: { height: 1, marginVertical: Spacing[4] },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
});
