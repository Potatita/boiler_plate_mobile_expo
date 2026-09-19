import { StyleSheet } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useEntitlement } from '@/contexts/entitlement';
import { hasActiveEntitlement, isPurchasesAvailable } from '@/lib/purchases';

export function Paywall({ onPurchased }: { onPurchased?: () => void }) {
  const { error, retry } = useEntitlement();

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.centeredText}>
          Subscriptions are temporarily unavailable
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          We could not verify your subscription account. Try again before making a purchase.
        </ThemedText>
        <ThemedButton title="Try again" onPress={retry} />
      </ThemedView>
    );
  }

  if (!isPurchasesAvailable) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.centeredText}>
          Go Pro
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          Unlock every feature with a subscription.
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          RevenueCat is not configured. Add EXPO_PUBLIC_REVENUECAT_IOS_API_KEY to .env.local, then
          restart the app to load subscription offerings.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <RevenueCatUI.Paywall
      style={styles.fullScreen}
      onPurchaseCompleted={({ customerInfo }) => {
        if (hasActiveEntitlement(customerInfo)) {
          onPurchased?.();
        }
      }}
      onRestoreCompleted={({ customerInfo }) => {
        if (hasActiveEntitlement(customerInfo)) {
          onPurchased?.();
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  fullScreen: {
    flex: 1,
  },
  centeredText: {
    textAlign: 'center',
  },
});
