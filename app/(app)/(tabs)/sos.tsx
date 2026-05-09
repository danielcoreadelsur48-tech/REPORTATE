import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSButton } from '@/components/features/SOSButton';
import { SOSConfirmModal } from '@/components/features/SOSConfirmModal';
import { useGroupStore } from '@/store/groupStore';
import { useSOS } from '@/hooks/useSOS';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function SOSScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { activeGroupId } = useGroupStore();
  const { isActive, triggerSOS, cancelSOS } = useSOS();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;

  function handleSOSPress() {
    if (isActive) {
      Alert.alert(
        STRINGS.SOS.DEACTIVATE_CONFIRM,
        '',
        [
          { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
          {
            text: STRINGS.SOS.DEACTIVATE_BUTTON,
            style: 'destructive',
            onPress: handleDeactivate,
          },
        ],
      );
    } else {
      setShowConfirm(true);
    }
  }

  async function handleConfirm() {
    setShowConfirm(false);
    if (!activeGroupId) {
      Alert.alert('Sin grupo', STRINGS.HOME.NO_GROUP);
      return;
    }
    setIsProcessing(true);
    try {
      await triggerSOS(activeGroupId);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeactivate() {
    setIsProcessing(true);
    try {
      await cancelSOS();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: textColor }]}>{STRINGS.SOS.TITLE}</Text>
        <Text style={styles.subtitle}>
          {isActive ? STRINGS.SOS.ACTIVE_BODY : STRINGS.SOS.SUBTITLE}
        </Text>

        {isActive && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerText}>{STRINGS.SOS.ACTIVE_TITLE}</Text>
          </View>
        )}

        <SOSButton isActive={isActive} onPress={handleSOSPress} />
      </View>

      <SOSConfirmModal
        visible={showConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
    gap: Spacing[6],
  },
  title: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, textAlign: 'center' },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.6,
  },
  activeBanner: {
    backgroundColor: Colors.danger.light,
    borderRadius: 12,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  activeBannerText: {
    color: Colors.danger.dark,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.base,
  },
});
