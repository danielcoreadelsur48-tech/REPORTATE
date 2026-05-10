import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useGroup } from '@/hooks/useGroup';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { CONFIG } from '@/constants/config';

export default function CreateGroupScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { create } = useGroup();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;

  async function handleCreate() {
    if (!name.trim()) { setNameError(STRINGS.ERRORS.REQUIRED); return; }
    setNameError('');
    setIsLoading(true);
    try {
      await create(name.trim(), description.trim() || undefined);
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as any)?.message ?? STRINGS.ERRORS.GENERIC;
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: textColor }]}>{STRINGS.GROUP.CREATE_GROUP}</Text>
            <View style={{ width: 24 }} />
          </View>
          <Input
            label={STRINGS.GROUP.GROUP_NAME_LABEL}
            placeholder={STRINGS.GROUP.GROUP_NAME_PLACEHOLDER}
            value={name}
            onChangeText={setName}
            error={nameError}
            maxLength={CONFIG.MAX_GROUP_NAME_LENGTH}
          />
          <Input
            label={STRINGS.GROUP.GROUP_DESC_LABEL}
            placeholder={STRINGS.GROUP.GROUP_DESC_PLACEHOLDER}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={CONFIG.MAX_GROUP_DESC_LENGTH}
          />
          <Button
            label={STRINGS.GROUP.CREATE_BUTTON}
            onPress={handleCreate}
            loading={isLoading}
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing[5], gap: Spacing[4] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[4] },
  title: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  btn: { marginTop: Spacing[4] },
});
