import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { CONFIG } from '@/constants/config';

interface SOSConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SOSConfirmModal({ visible, onConfirm, onCancel }: SOSConfirmModalProps) {
  const [countdown, setCountdown] = useState(CONFIG.SOS_COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setCountdown(CONFIG.SOS_COUNTDOWN_SECONDS);
      progress.setValue(0);
      return;
    }

    Animated.timing(progress, {
      toValue: 1,
      duration: CONFIG.SOS_COUNTDOWN_SECONDS * 1000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onConfirm();
    });

    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current!);
      progress.stopAnimation();
    };
  }, [visible]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal visible={visible} title={STRINGS.SOS.CONFIRM_TITLE}>
      <Text style={styles.body}>{STRINGS.SOS.CONFIRM_BODY}</Text>

      <View style={styles.countdownWrapper}>
        <Text style={styles.countdownLabel}>{STRINGS.SOS.COUNTDOWN}</Text>
        <Text style={styles.countdownNumber}>{countdown}</Text>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressBar, { width: barWidth }]} />
        </View>
      </View>

      <Button
        label={STRINGS.SOS.CANCEL_BUTTON}
        variant="outline"
        onPress={onCancel}
        style={styles.cancelBtn}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing[5],
    lineHeight: Typography.size.base * 1.5,
  },
  countdownWrapper: { alignItems: 'center', marginBottom: Spacing[5] },
  countdownLabel: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
  },
  countdownNumber: {
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.danger.DEFAULT,
    marginVertical: Spacing[2],
  },
  progressBg: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.danger.DEFAULT,
    borderRadius: 3,
  },
  cancelBtn: { marginTop: Spacing[2] },
});
