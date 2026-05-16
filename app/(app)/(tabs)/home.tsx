import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ReportButtonGrid } from '@/components/features/ReportButtonGrid';
import { GroupPickerSheet } from '@/components/features/GroupPickerSheet';
import { HomeArrivalButton } from '@/components/features/HomeArrivalButton';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useGroup } from '@/hooks/useGroup';
import { useReportButtons } from '@/hooks/useReportButtons';
import { ReportButtonWithState } from '@/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { requestLocationPermission, getCurrentLocation } from '@/services/location/getCurrentLocation';
import { sendGroupNotification } from '@/services/notifications/sendNotification';
import { insertHomeArrival } from '@/services/supabase/reportButtons';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { user } = useAuthStore();
  const { groups, activeGroupId, loadGroups, isLoadingGroups } = useGroup();
  const [showPicker, setShowPicker] = useState(false);
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const isCaptain = groups.find((g) => g.id === activeGroupId)?.role === 'captain';
  const { buttons, isLoading: buttonsLoading, error: buttonsError, load: loadButtons, press: pressButton } =
    useReportButtons(activeGroupId, isCaptain ?? false);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (activeGroupId) {
      loadButtons();
    }
  }, [activeGroupId, loadButtons]);

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await loadGroups();
    if (activeGroupId) await loadButtons();
    setRefreshing(false);
  }

  async function handleButtonPress(button: ReportButtonWithState) {
    try {
      await pressButton(button);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    }
  }

  async function handleHomeArrival() {
    if (!activeGroupId || !user) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      let loc: { lat: number; lng: number } | undefined;
      const granted = await requestLocationPermission();
      if (granted) {
        try { loc = await getCurrentLocation(); } catch { /* GPS falló */ }
      }
      try {
        await insertHomeArrival({ userId: user.id, groupId: activeGroupId, location: loc });
      } catch { /* continuar aunque falle el registro */ }
      await sendGroupNotification({
        groupId: activeGroupId,
        type: 'HOME_ARRIVAL',
        title: STRINGS.HOME_BUTTON.NOTIFICATION_TITLE,
        body: STRINGS.HOME_BUTTON.NOTIFICATION_BODY.replace('{name}', user.full_name),
        data: loc ? { lat: loc.lat, lng: loc.lng } : undefined,
      });
      Alert.alert(STRINGS.HOME_BUTTON.SUCCESS_TITLE, STRINGS.HOME_BUTTON.SUCCESS_BODY);
    } catch {
      Alert.alert('Error', STRINGS.ERRORS.GENERIC);
    }
  }

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const subtextColor = Colors.text.secondary;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: subtextColor }]}>Hola,</Text>
          <Text style={[styles.name, { color: textColor }]}>{user?.full_name ?? '...'}</Text>
        </View>

        {isLoadingGroups && groups.length === 0 ? (
          <View style={styles.skeletonContainer}>
            <Skeleton height={56} borderRadius={Radius.xl} />
            <Skeleton height={56} borderRadius={Radius.xl} />
            <Skeleton height={56} borderRadius={Radius.xl} />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.noGroupContainer}>
            <View style={[styles.noGroupIcon, { backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[100] }]}>
              <Ionicons name="people-outline" size={56} color={Colors.primary[500]} />
            </View>
            <Text style={[styles.noGroupTitle, { color: textColor }]}>
              {STRINGS.HOME.NO_GROUP}
            </Text>
            <Text style={[styles.noGroupSubtitle, { color: subtextColor }]}>
              Crea tu propio grupo o únete a uno con un código de invitación
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/group/create')}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.GROUP.CREATE_GROUP}
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={28} color={Colors.text.inverse} />
              <Text style={styles.actionBtnText}>{STRINGS.GROUP.CREATE_GROUP}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(app)/group/join')}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.GROUP.JOIN_GROUP}
              style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: Colors.primary[500] }]}
              activeOpacity={0.85}
            >
              <Ionicons name="key-outline" size={28} color={Colors.primary[500]} />
              <Text style={[styles.actionBtnText, { color: Colors.primary[500] }]}>{STRINGS.GROUP.JOIN_GROUP}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {groups.length > 1 && activeGroup && (
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Cambiar grupo"
                style={[
                  styles.groupSelectorBtn,
                  { backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[100] },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.groupSelectorAvatar}>
                  <Text style={styles.groupSelectorAvatarText}>
                    {activeGroup.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.groupSelectorName, { color: isDark ? Colors.neutral[0] : Colors.text.primary }]} numberOfLines={1}>
                  {activeGroup.name}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}

            {buttons.length > 0 && (
              <Card style={styles.buttonsCard}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  {STRINGS.REPORT_BUTTONS.SECTION_TITLE}
                </Text>
                {buttonsError && (
                  <Text style={styles.errorText}>{buttonsError}</Text>
                )}
                <ReportButtonGrid
                  buttons={buttons}
                  onPress={handleButtonPress}
                  isLoading={buttonsLoading}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <GroupPickerSheet visible={showPicker} onClose={() => setShowPicker(false)} />
      {groups.length > 0 && activeGroupId && (
        <HomeArrivalButton onPress={handleHomeArrival} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing[5], paddingBottom: 128, gap: Spacing[5], flexGrow: 1 },
  greeting: { marginBottom: Spacing[2] },
  hello: { fontSize: Typography.size.base },
  name: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold },
  groupSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.xl,
  },
  groupSelectorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupSelectorAvatarText: {
    color: Colors.text.inverse,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  groupSelectorName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  buttonsCard: { gap: Spacing[4] },
  cardTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  errorText: { color: Colors.danger.DEFAULT, fontSize: Typography.size.sm },
  skeletonContainer: {
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  noGroupContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[5],
    paddingVertical: Spacing[10],
  },
  noGroupIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGroupTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  noGroupSubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing[4],
  },
  actionBtn: {
    width: '100%',
    height: 64,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    ...Shadow.md,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary[500],
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  actionBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text.inverse,
  },
});
