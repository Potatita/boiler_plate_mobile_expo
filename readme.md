# Expo boilerplate 👋

An [Expo](https://expo.dev) SDK 57 starter with file-based routing, themed UI primitives, Supabase
auth (Sign in with Apple) and RevenueCat wired up and ready to go.

Everything optional degrades instead of crashing: the app boots and runs with no credentials at all.

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Run a development build

   ```bash
   pnpx expo@57.0.18 run:ios
   ```

This project uses **pnpm**. Do not use `npm install` or `yarn add`. To add an Expo SDK package, use
`pnpx expo@57.0.18 install <package>` so the version matches the installed SDK; anything else goes through
`pnpm add <package>`.

A **development build** is required. Sign in with Apple and RevenueCat are native modules that are
not present in Expo Go, so `pnpx expo@57.0.18 start` against Expo Go will not be able to run them.

You can start developing by editing the files inside the **src/app** directory. This project uses
[file-based routing](https://docs.expo.dev/router/introduction).

## App flow

The root stack in `src/app/_layout.tsx` exposes three mutually exclusive states through
`Stack.Protected` guards:

| State                 | Reachable screens                                                |
| --------------------- | ---------------------------------------------------------------- |
| No session            | `(public)`: welcome and either onboarding → paywall or sign-in   |
| Session, not entitled | `subscribe` (authenticated paywall plus sign-out)                |
| Session and entitled  | `(app)`: the native tabs                                          |

The public flow has two intentional branches:

- **New user:** Continue → onboarding → anonymous hard paywall → sign-in.
- **Existing account:** “I already have an account” → sign-in directly.

RevenueCat starts with an anonymous App User ID so the new-user branch can purchase before creating
an account. Existing users are not asked to purchase anonymously merely to log in. After successful
authentication, `Purchases.logIn(<supabase user id>)` switches to the identified customer and the
root waits for that returned `CustomerInfo` before routing to either `(app)` or `subscribe`.

```
src/app/
  _layout.tsx            root Stack with the three guards, SessionProvider > AnalyticsProvider > EntitlementProvider
  subscribe.tsx          /subscribe   post-login paywall
  (public)/
    _layout.tsx
    welcome.tsx          /welcome
    onboarding.tsx       /onboarding
    paywall.tsx          /paywall
    sign-in.tsx          /sign-in
  (app)/
    _layout.tsx          native tabs
    index.tsx            /
    explore.tsx          /explore
```

Route groups do not change URLs, so the public landing screen is `welcome.tsx` rather than
`index.tsx`: `(public)/index.tsx` and `(app)/index.tsx` would both resolve to `/` and collide.

## Subscriptions

Entitlement state lives in `src/contexts/entitlement.tsx`. It owns RevenueCat identity and
entitlement as one serialized operation. Signed-out users resolve the `anonymous` identity;
authenticated users resolve `user:<supabase uuid>`. Login uses `Purchases.logIn`, sign-out uses
`Purchases.logOut` to create the next anonymous customer, and every transition derives access from
the returned `CustomerInfo`. State fails closed while identities change and a retry screen replaces
the paywall whenever identity cannot be verified.

RevenueCat may choose not to merge an anonymous purchase when the target custom App User ID already
has an anonymous alias. The app handles this honestly: if the `CustomerInfo` returned by `logIn`
lacks the entitlement, the authenticated user lands on `/subscribe` and must use the paywall's
Restore action. It never grants access based on the previous anonymous state.

`ENTITLEMENT_ID` in `src/lib/purchases.ts` is the only string to change per project. It defaults to
`'pro'` and must match the entitlement identifier configured in the RevenueCat dashboard.

The paywall (`src/components/paywall.tsx`) renders RevenueCat's own **Paywall Builder** UI via
`react-native-purchases-ui`'s embeddable `RevenueCatUI.Paywall` component, loaded for the **current
offering**. Its design, copy, and pricing layout are configured entirely from the RevenueCat
dashboard — changing them never requires an app rebuild. `ENTITLEMENT_ID` in `src/lib/purchases.ts`
must match the entitlement identifier configured there; a completed purchase or restore is only
treated as success once that entitlement is confirmed active on the resulting `customerInfo`. The
Restore purchases action that App Review requires is built into the dashboard-configured paywall
UI itself.

The acquisition paywall is a hard paywall for users who enter through onboarding. Existing-account
login remains public by design, but this does not bypass premium access: the root `Stack.Protected`
guard keeps `(app)` unavailable until the entitlement has been resolved for the authenticated
Supabase UUID. A non-premium account reaches only `/subscribe`. In Paywalls V2, close buttons are
dashboard components and `displayCloseButton` has no effect. Omit close buttons from the dashboard
paywall; route protection, not paywall chrome, is the access control.

## Environment variables

Create a `.env.local` file in the project root. It is gitignored and never committed.

| Variable                                  | Used for                       |
| ----------------------------------------- | ------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`                | Supabase project URL           |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`    | Supabase publishable key       |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`      | RevenueCat iOS public API key  |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`  | RevenueCat Android public API key |
| `EXPO_PUBLIC_POSTHOG_API_KEY`             | PostHog project API key        |
| `EXPO_PUBLIC_POSTHOG_HOST`                | Optional PostHog host; defaults to `https://us.i.posthog.com` |

**The app runs without them.** Auth and purchases are simply inert: the hard paywall explains when
RevenueCat is missing, no Supabase client is created without its credentials, and the RevenueCat
SDK is never configured without its platform key. Existing accounts can still reach the sign-in
screen, but without RevenueCat configuration no account can pass the authenticated premium guard.
Restart the dev server after changing the file so the new values are inlined into the bundle.

## Onboarding analytics

PostHog is optional. Without `EXPO_PUBLIC_POSTHOG_API_KEY`, the analytics provider is a no-op: it
does not initialize the SDK, log errors, or make network requests. Add the public project key (and
`EXPO_PUBLIC_POSTHOG_HOST` only for a regional or self-hosted instance), then restart the dev server;
no source changes are needed.

Analytics is deliberately manual only. Touch autocapture, route autocapture, session replay,
feature flags, surveys, lifecycle events, and native-crash tracking are disabled. This keeps the
onboarding funnel intentional and prevents onboarding copy, email addresses, or other PII from
being captured accidentally.

| Event | When emitted | Properties |
| ----- | ------------ | ---------- |
| `onboarding started` | Once when the onboarding screen mounts | `onboarding_step_count` |
| `onboarding step viewed` | Once for every slide reached during that mount | `onboarding_step_id`, `onboarding_step_number`, `onboarding_step_count` |
| `onboarding completed` | Once, immediately before navigating to the paywall | `onboarding_step_count` |

Step IDs are stable non-PII identifiers (`value-proposition`, `key-feature`, and
`subscription-expectation`); do not replace them with rendered titles or descriptions. Button
navigation and scroll momentum share the same deduplication guard, so each reached step produces
one event per mount.

To verify a configured project, open **PostHog > Event Debugger** and run the onboarding from a
fresh app launch. Confirm the ordered sequence `onboarding started` → each reached `onboarding step
viewed` → `onboarding completed`, then continue through login to confirm anonymous activity is
identified with the Supabase UUID. Log out before testing another account so analytics resets to a
fresh anonymous identity.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Enable **Authentication > Providers > Apple**.
3. Add the app's bundle identifier to that provider's **Client IDs** list.

## RevenueCat setup

1. Create a project at [revenuecat.com](https://www.revenuecat.com).
2. Add the iOS public API key to `.env.local`.
3. Create an entitlement and set `ENTITLEMENT_ID` in `src/lib/purchases.ts` to its identifier.
4. Attach the subscription products to the **current offering**; that offering is what the paywall
   renders.
5. Configure **Restore Behavior** as **Transfer to new App User ID**. RevenueCat specifically
   recommends this for apps that allow purchase before account creation.
6. Build the Paywalls V2 design without a close button so the UI matches the hard-paywall route.
7. Sync subscription state to your backend through an authenticated, idempotent **RevenueCat
   webhook**. Initial purchase events can use a `$RCAnonymousID`; reconciliation must consider the
   event's `app_user_id`, `original_app_user_id`, `aliases`, and transfer events rather than
   assuming the Supabase UUID is always the original ID. Never trust client entitlement state for
   server-protected data.

## Get a fresh project

When you're ready, run:

```bash
pnpm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app**
directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
