import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useSession } from '@/contexts/session';
import {
  hasActiveEntitlement,
  isPurchasesAvailable,
  subscribeToCustomerInfo,
  syncPurchasesIdentity,
} from '@/lib/purchases';

type EntitlementContextValue = {
  isEntitled: boolean;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

type EntitlementState = {
  identityKey: string | null;
  isEntitled: boolean;
  error: Error | null;
};

const initialState: EntitlementState = {
  identityKey: null,
  isEntitled: false,
  error: null,
};

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { session, isLoading: isSessionLoading } = useSession();
  const [state, setState] = useState<EntitlementState>(initialState);
  const [attempt, setAttempt] = useState(0);
  const userId = session?.user.id ?? null;
  const desiredIdentityKey = isSessionLoading ? null : userId ? `user:${userId}` : 'anonymous';

  useEffect(() => {
    if (!desiredIdentityKey) {
      return;
    }

    if (!isPurchasesAvailable) {
      setState({
        identityKey: desiredIdentityKey,
        isEntitled: false,
        error: null,
      });
      return;
    }

    const currentIdentityKey = desiredIdentityKey;
    let isActive = true;
    let unsubscribe = () => {};

    setState(initialState);

    async function synchronize() {
      try {
        const customerInfo = await syncPurchasesIdentity(userId);
        if (!isActive || !customerInfo) {
          return;
        }

        setState({
          identityKey: currentIdentityKey,
          isEntitled: hasActiveEntitlement(customerInfo),
          error: null,
        });

        unsubscribe = subscribeToCustomerInfo((nextIsEntitled) => {
          if (isActive) {
            setState({
              identityKey: currentIdentityKey,
              isEntitled: nextIsEntitled,
              error: null,
            });
          }
        });
      } catch (error) {
        if (isActive) {
          const nextError = error instanceof Error ? error : new Error('Unknown RevenueCat error');
          console.warn('RevenueCat identity sync failed', nextError);
          setState({
            identityKey: currentIdentityKey,
            isEntitled: false,
            error: nextError,
          });
        }
      }
    }

    void synchronize();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [attempt, desiredIdentityKey, userId]);

  const retry = useCallback(() => {
    setState(initialState);
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  const isCurrentIdentityResolved =
    desiredIdentityKey !== null && state.identityKey === desiredIdentityKey;
  const isEntitled = Boolean(isCurrentIdentityResolved && state.isEntitled);
  const error = isCurrentIdentityResolved ? state.error : null;
  const isLoading = Boolean(
    isSessionLoading ||
      (desiredIdentityKey && isPurchasesAvailable && !isCurrentIdentityResolved && !error)
  );

  return (
    <EntitlementContext.Provider
      value={{
        isEntitled,
        isLoading,
        error,
        retry,
      }}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement() {
  const value = useContext(EntitlementContext);
  if (!value) {
    throw new Error('useEntitlement must be used within an EntitlementProvider');
  }
  return value;
}
