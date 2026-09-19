import { router } from 'expo-router';

import { Paywall } from '@/components/paywall';

export default function PaywallScreen() {
  return <Paywall onPurchased={() => router.replace('/sign-in')} />;
}
