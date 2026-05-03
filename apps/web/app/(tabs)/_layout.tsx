import { Tabs } from 'expo-router';

import { palette, radii, spacing } from '@qurl/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 66,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
        },
        tabBarItemStyle: {
          borderRadius: radii.sm,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Create' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
