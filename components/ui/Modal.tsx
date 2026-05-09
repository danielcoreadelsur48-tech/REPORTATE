import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

interface ModalProps {
  visible: boolean;
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Modal({ visible, title, onClose, children }: ModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? Colors.surface.dark : Colors.surface.light;

  return (
    <RNModal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: bg }]}>
              {title && (
                <Text style={[styles.title, { color: isDark ? Colors.neutral[0] : Colors.text.primary }]}>
                  {title}
                </Text>
              )}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  container: {
    width: '100%',
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    ...Shadow.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
});
