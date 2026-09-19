import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session';

function isCanceledError(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED';
}

export default function SignInScreen() {
  const { isConfigured, signInWithApple } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isAppleButtonDisabled = isSigningIn || !isConfigured;

  async function handleAppleSignIn() {
    setIsSigningIn(true);
    try {
      await signInWithApple();
    } catch (error) {
      if (!isCanceledError(error)) {
        console.warn('Apple sign-in failed', error);
      }
      setIsSigningIn(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Sign in
        </ThemedText>

        {!isConfigured && (
          <ThemedText themeColor="textSecondary" style={styles.message}>
            Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and
            EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the app to enable sign
            in.
          </ThemedText>
        )}

        {Platform.OS === 'ios' ? (
          <View
            style={[
              styles.appleButtonWrapper,
              isAppleButtonDisabled && styles.appleButtonWrapperDisabled,
            ]}
            pointerEvents={isAppleButtonDisabled ? 'none' : 'auto'}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          </View>
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.message}>
            Sign in with Apple is only available on iOS. No other sign-in provider is configured
            yet.
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  appleButtonWrapper: {
    alignSelf: 'stretch',
  },
  appleButtonWrapperDisabled: {
    opacity: 0.4,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
});
