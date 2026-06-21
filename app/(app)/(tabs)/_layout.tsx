import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { useNotificationStore } from '@/store/notificationStore';
import { STRINGS } from '@/constants/strings';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const tabBarBg = isDark ? Colors.surface.dark : Colors.surface.light;
  const activeTint = Colors.primary[500];
  const inactiveTint = Colors.neutral[400];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: tabBarBg, borderTopWidth: 0, elevation: 8 },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          tabBarAccessibilityLabel: 'Tab Home',
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: 'Grupo',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          tabBarAccessibilityLabel: 'Tab Grupo',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: STRINGS.NOTIFICATIONS_SCREEN.TAB_LABEL,
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.danger.DEFAULT,
            color: Colors.neutral[0],
            fontSize: 10,
            minWidth: 16,
            height: 16,
            lineHeight: 16,
          },
          tabBarAccessibilityLabel: 'Tab Alertas',
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle" size={size} color={color} />
          ),
          tabBarActiveTintColor: Colors.danger.DEFAULT,
          tabBarAccessibilityLabel: 'Tab SOS',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          tabBarAccessibilityLabel: 'Tab Perfil',
        }}
      />
    </Tabs>
  );
}
