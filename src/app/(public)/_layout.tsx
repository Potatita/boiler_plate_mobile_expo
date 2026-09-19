import { Stack } from 'expo-router';

import { useEntitlement } from '@/contexts/entitlement';

export const unstable_settings = {
  anchor: 'welcome',
  initialRouteName: 'welcome',
};

export default function PublicLayout() {
  const { isEntitled } = useEntitlement();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="sign-in" />

      <Stack.Protected guard={!isEntitled}>
        <Stack.Screen name="paywall" />
      </Stack.Protected>
    </Stack>
  );
}
