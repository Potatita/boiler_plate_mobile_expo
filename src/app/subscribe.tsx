import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Paywall } from '@/components/paywall';
import { ThemedButton } from '@/components/themed-button';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session';

export default function SubscribeScreen() {
  const { signOut } = useSession();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Paywall />

        <ThemedButton
          variant="secondary"
          title="Sign out"
          onPress={() => signOut()}
          style={styles.signOutButton}
        />
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
    justifyContent: 'center',
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  signOutButton: {
    alignSelf: 'stretch',
  },
});
