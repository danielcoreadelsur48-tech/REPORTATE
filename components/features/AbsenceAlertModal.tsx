import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

interface AbsenceAlertModalProps {
  visible: boolean;
  absentNames: string[];
  onSend: (message: string) => Promise<void>;
  onCancel: () => void;
}

export function AbsenceAlertModal({ visible, absentNames, onSend, onCancel }: AbsenceAlertModalProps) {
  const defaultMessage = `${STRINGS.GROUP.ABSENCE_ALERT_BODY}\n${absentNames.join(', ')}`;
  const [message, setMessage] = useState(defaultMessage);
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    setIsSending(true);
    try {
      await onSend(message);
      onCancel();
    } finally {
      setIsSending(false);
    }
  }

  if (absentNames.length === 0) {
    return (
      <Modal visible={visible} title={STRINGS.GROUP.ABSENCE_ALERT_TITLE} onClose={onCancel}>
        <Text style={styles.noAbsences}>{STRINGS.GROUP.NO_ABSENCES}</Text>
        <Button label={STRINGS.COMMON.DONE} onPress={onCancel} />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} title={STRINGS.GROUP.ABSENCE_ALERT_TITLE} onClose={onCancel}>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        accessibilityLabel="Mensaje de alerta"
      />
      <View style={styles.actions}>
        <Button label={STRINGS.COMMON.CANCEL} variant="ghost" onPress={onCancel} style={styles.btn} />
        <Button
          label={STRINGS.GROUP.SEND_ALERT}
          variant="danger"
          onPress={handleSend}
          loading={isSending}
          style={styles.btn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: Radius.lg,
    padding: Spacing[3],
    fontSize: Typography.size.sm,
    color: Colors.text.primary,
    minHeight: 100,
    marginBottom: Spacing[4],
  },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  btn: { flex: 1 },
  noAbsences: {
    fontSize: Typography.size.base,
    color: Colors.success.DEFAULT,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
});
