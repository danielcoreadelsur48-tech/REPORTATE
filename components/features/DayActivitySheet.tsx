import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { DayActivityContent } from './DayActivityContent';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

interface DayActivitySheetProps {
  visible: boolean;
  groupId: string | null;
  isCaptain: boolean;
  onClose: () => void;
}

export function DayActivitySheet({ visible, groupId, isCaptain, onClose }: DayActivitySheetProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? Colors.surface.dark : Colors.surface.light;
  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;

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
              <Text style={[styles.title, { color: textColor }]}>{STRINGS.ACTIVITY_SHEET.TITLE}</Text>
              <DayActivityContent groupId={groupId} isCaptain={isCaptain} isActive={visible} />
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
    height: '82%',
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
    marginBottom: Spacing[4],
  },
});
