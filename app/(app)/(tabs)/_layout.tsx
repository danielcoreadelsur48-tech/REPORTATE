import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

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
          title: 'Jornada',
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} />,
          tabBarAccessibilityLabel: 'Tab Jornada',
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
