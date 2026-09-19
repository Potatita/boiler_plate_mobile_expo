import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import PostHog, { PostHogProvider } from 'posthog-react-native';

import { useSession } from '@/contexts/session';

type AnalyticsContextValue = {
  capture: (event: string, properties?: AnalyticsProperties) => void;
  isEnabled: boolean;
};

type AnalyticsProperties = Parameters<PostHog['capture']>[1];

const postHogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
const postHogHost =
  process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';

const postHog = postHogApiKey
  ? new PostHog(postHogApiKey, {
      host: postHogHost,
      captureAppLifecycleEvents: false,
      disableRemoteFeatureFlags: true,
      disableSurveys: true,
      enableSessionReplay: false,
      errorTracking: {
        autocapture: false,
        exceptionSteps: { enabled: false },
      },
      preloadFeatureFlags: false,
    })
  : null;

const noopAnalytics: AnalyticsContextValue = {
  capture: () => {},
  isEnabled: false,
};

const AnalyticsContext = createContext<AnalyticsContextValue>(noopAnalytics);

function PostHogIdentitySync({ client }: { client: PostHog }) {
  const { session, isLoading } = useSession();
  const desiredUserId = isLoading ? undefined : (session?.user.id ?? null);
  const latestDesiredUserId = useRef(desiredUserId);

  latestDesiredUserId.current = desiredUserId;

  useEffect(() => {
    if (desiredUserId === undefined) {
      return;
    }

    let isCancelled = false;

    async function syncIdentity() {
      await client.ready();

      if (isCancelled || latestDesiredUserId.current !== desiredUserId) {
        return;
      }

      const distinctId = client.getDistinctId();
      const anonymousId = client.getAnonymousId();
      const isAnonymous = distinctId === anonymousId;

      if (!desiredUserId) {
        if (!isAnonymous) {
          client.reset();
        }
        return;
      }

      if (distinctId === desiredUserId) {
        return;
      }

      if (!isAnonymous) {
        client.reset();
      }

      client.identify(desiredUserId);
    }

    void syncIdentity().catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [client, desiredUserId]);

  return null;
}

function ConfiguredAnalyticsProvider({ children }: { children: ReactNode }) {
  const capture = useCallback(
    (event: string, properties?: AnalyticsProperties) => {
      postHog?.capture(event, properties);
    },
    []
  );
  const value = useMemo<AnalyticsContextValue>(
    () => ({ capture, isEnabled: true }),
    [capture]
  );

  if (!postHog) {
    return null;
  }

  return (
    <AnalyticsContext.Provider value={value}>
      <PostHogProvider client={postHog} autocapture={false}>
        <PostHogIdentitySync client={postHog} />
        {children}
      </PostHogProvider>
    </AnalyticsContext.Provider>
  );
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!postHog) {
    return <AnalyticsContext.Provider value={noopAnalytics}>{children}</AnalyticsContext.Provider>;
  }

  return <ConfiguredAnalyticsProvider>{children}</ConfiguredAnalyticsProvider>;
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
