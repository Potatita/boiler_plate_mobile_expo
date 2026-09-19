import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AnalyticsProvider } from '@/contexts/analytics';
import { EntitlementProvider, useEntitlement } from '@/contexts/entitlement';
import { SessionProvider, useSession } from '@/contexts/session';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { session, isLoading: isSessionLoading } = useSession();
  const { isEntitled, isLoading: isEntitlementLoading } = useEntitlement();

  if (isSessionLoading || isEntitlementLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session && isEntitled}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !isEntitled}>
        <Stack.Screen name="subscribe" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <SessionProvider>
        <AnalyticsProvider>
          <EntitlementProvider>
            <RootStack />
          </EntitlementProvider>
        </AnalyticsProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
