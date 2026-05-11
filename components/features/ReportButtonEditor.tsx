import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DBReportButton } from '@/types/database';
import { createButton, updateButton } from '@/services/supabase/reportButtons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { CONFIG } from '@/constants/config';

interface ReportButtonEditorProps {
  groupId: string;
  button?: DBReportButton | null;
  onSave: (saved: DBReportButton) => void;
  onClose: () => void;
}

export function ReportButtonEditor({ groupId, button, onSave, onClose }: ReportButtonEditorProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const secondaryColor = isDark ? Colors.neutral[400] : Colors.text.secondary;

  const [name, setName] = useState(button?.name ?? '');
  const [icon, setIcon] = useState(button?.icon ?? CONFIG.REPORT_BUTTON_ICONS[0]);
  const [hours, setHours] = useState(
    button ? button.activation_time.split(':')[0] : '08',
  );
  const [minutes, setMinutes] = useState(
    button ? button.activation_time.split(':')[1] : '00',
  );
  const [windowMinutes, setWindowMinutes] = useState(
    button ? String(button.window_minutes) : '60',
  );
  const [isHomeButton, setIsHomeButton] = useState(button?.is_home_button ?? false);
  const [sortOrder, setSortOrder] = useState(button ? String(button.sort_order) : '1');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = !!button;

  async function handleSave() {
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(STRINGS.ERRORS.REQUIRED);
      return;
    }

    const hh = parseInt(hours, 10);
    const mm = parseInt(minutes, 10);
    if (isNaN(hh) || hh < 0 || hh > 23 || isNaN(mm) || mm < 0 || mm > 59) {
      setFormError('Hora inválida. Usa formato 0–23 para horas y 0–59 para minutos.');
      return;
    }

    const wm = parseInt(windowMinutes, 10);
    if (isNaN(wm) || wm <= 0) {
      setFormError('La ventana debe ser mayor a 0 minutos.');
      return;
    }

    const so = parseInt(sortOrder, 10);
    if (isNaN(so) || so < 1 || so > 5) {
      setFormError('El orden debe ser entre 1 y 5.');
      return;
    }

    const payload = {
      name: trimmedName,
      icon,
      activation_time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`,
      window_minutes: wm,
      is_home_button: isHomeButton,
      sort_order: so,
    };

    setIsSaving(true);
    try {
      let saved: DBReportButton;
      if (isEditing) {
        saved = await updateButton(button.id, payload);
      } else {
        saved = await createButton(groupId, payload);
      }
      onSave(saved);
    } catch (e) {
      const msg = e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC;
      if (
        msg.includes('Máximo 5') ||
        msg.includes('botón de casa')
      ) {
        setFormError(msg);
      } else {
        Alert.alert(STRINGS.ERRORS.GENERIC, msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      visible
      title={isEditing ? STRINGS.REPORT_BUTTONS.EDIT_BUTTON : STRINGS.REPORT_BUTTONS.ADD_BUTTON}
      onClose={onClose}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Name */}
        <Input
          label={STRINGS.REPORT_BUTTONS.BUTTON_NAME_LABEL}
          placeholder={STRINGS.REPORT_BUTTONS.BUTTON_NAME_PLACEHOLDER}
          value={name}
          onChangeText={setName}
          maxLength={CONFIG.MAX_BUTTON_NAME_LENGTH}
          autoCapitalize="sentences"
        />

        {/* Icon picker */}
        <Text style={[styles.fieldLabel, { color: textColor }]}>
          {STRINGS.REPORT_BUTTONS.ICON_LABEL}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
          {CONFIG.REPORT_BUTTON_ICONS.map((iconName) => {
            const selected = icon === iconName;
            return (
              <TouchableOpacity
                key={iconName}
                onPress={() => setIcon(iconName)}
                style={[styles.iconCell, selected && styles.iconCellSelected]}
                accessibilityRole="button"
                accessibilityLabel={iconName}
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={iconName as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={selected ? Colors.primary[500] : Colors.neutral[400]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Activation time */}
        <Text style={[styles.fieldLabel, { color: textColor }]}>
          {STRINGS.REPORT_BUTTONS.TIME_LABEL}
        </Text>
        <View style={styles.timeRow}>
          <View style={styles.timeInputFlex}>
            <Input
              placeholder={STRINGS.REPORT_BUTTONS.TIME_HOURS_PLACEHOLDER}
              value={hours}
              onChangeText={setHours}
              keyboardType="numeric"
              maxLength={2}
              style={styles.timeInputText}
            />
          </View>
          <Text style={[styles.timeSep, { color: secondaryColor }]}>:</Text>
          <View style={styles.timeInputFlex}>
            <Input
              placeholder={STRINGS.REPORT_BUTTONS.TIME_MINUTES_PLACEHOLDER}
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="numeric"
              maxLength={2}
              style={styles.timeInputText}
            />
          </View>
        </View>

        {/* Window minutes */}
        <Input
          label={STRINGS.REPORT_BUTTONS.WINDOW_LABEL}
          value={windowMinutes}
          onChangeText={setWindowMinutes}
          keyboardType="numeric"
          maxLength={4}
        />

        {/* Sort order */}
        <Input
          label={STRINGS.REPORT_BUTTONS.SORT_ORDER_LABEL}
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="numeric"
          maxLength={1}
        />

        {/* Home button toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: textColor }]}>
              {STRINGS.REPORT_BUTTONS.HOME_BUTTON_LABEL}
            </Text>
            <Text style={[styles.toggleNote, { color: secondaryColor }]}>
              {STRINGS.REPORT_BUTTONS.HOME_BUTTON_NOTE}
            </Text>
          </View>
          <Switch
            value={isHomeButton}
            onValueChange={setIsHomeButton}
            trackColor={{ true: Colors.primary[500], false: Colors.neutral[200] }}
            thumbColor={Colors.neutral[0]}
          />
        </View>

        {formError && (
          <Text style={styles.formError}>{formError}</Text>
        )}

        <View style={styles.actions}>
          <Button
            label={STRINGS.COMMON.CANCEL}
            variant="outline"
            onPress={onClose}
            style={styles.actionBtn}
          />
          <Button
            label={STRINGS.REPORT_BUTTONS.SAVE_BUTTON}
            loading={isSaving}
            onPress={handleSave}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing[2],
  },
  iconScroll: {
    marginBottom: Spacing[4],
  },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.neutral[100],
  },
  iconCellSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  timeInputFlex: {
    flex: 1,
  },
  timeInputText: {
    textAlign: 'center',
  },
  timeSep: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginTop: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
    gap: Spacing[3],
  },
  toggleInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  toggleLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  toggleNote: {
    fontSize: Typography.size.xs,
  },
  formError: {
    color: Colors.danger.DEFAULT,
    fontSize: Typography.size.sm,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  actionBtn: {
    flex: 1,
  },
});
