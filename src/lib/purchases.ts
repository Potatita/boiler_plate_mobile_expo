import { Platform } from 'react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';

const purchasesApiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
});

export const isPurchasesAvailable = Boolean(purchasesApiKey);

// The single entitlement this app sells. Change it to match the entitlement identifier
// configured in the RevenueCat dashboard.
export const ENTITLEMENT_ID = 'pro';

let identitySyncQueue = Promise.resolve();

function serializeIdentitySync<T>(operation: () => Promise<T>) {
  const result = identitySyncQueue.then(operation, operation);
  identitySyncQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export async function syncPurchasesIdentity(userId: string | null): Promise<CustomerInfo | null> {
  if (!purchasesApiKey) {
    return null;
  }

  return serializeIdentitySync(async () => {
    if (!(await Purchases.isConfigured())) {
      Purchases.configure({
        apiKey: purchasesApiKey,
        ...(userId ? { appUserID: userId } : {}),
      });
      return Purchases.getCustomerInfo();
    }

    if (!userId) {
      if (await Purchases.isAnonymous()) {
        return Purchases.getCustomerInfo();
      }

      return Purchases.logOut();
    }

    if ((await Purchases.getAppUserID()) === userId) {
      return Purchases.getCustomerInfo();
    }

    return (await Purchases.logIn(userId)).customerInfo;
  });
}

export function hasActiveEntitlement(customerInfo: CustomerInfo) {
  return ENTITLEMENT_ID in customerInfo.entitlements.active;
}

export function subscribeToCustomerInfo(listener: (isEntitled: boolean) => void) {
  if (!isPurchasesAvailable) {
    return () => {};
  }

  const handleUpdate = (customerInfo: CustomerInfo) => listener(hasActiveEntitlement(customerInfo));

  Purchases.addCustomerInfoUpdateListener(handleUpdate);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(handleUpdate);
  };
}
