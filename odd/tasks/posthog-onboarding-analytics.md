# PostHog Onboarding Analytics

## Objective

Add manual, reliable PostHog events for the onboarding funnel while keeping analytics completely
inert until public PostHog credentials are configured.

## Problem

The onboarding uses three `FlatList` slides inside one Expo Router screen, so route-level analytics
cannot reveal which step users abandon. The app also has anonymous acquisition followed by Supabase
authentication, which requires an explicit analytics identity transition.

## Why

Manual step events provide a stable funnel from onboarding start through completion without relying
on touch or screen autocapture. Anonymous events must remain linkable to the authenticated user
after login without mixing data between accounts after logout.

## Scope

- Install the official PostHog React Native SDK and Expo-compatible peer dependencies.
- Add an optional analytics provider that is a no-op until credentials exist.
- Capture stable manual onboarding start, step-view, and completion events.
- Identify with the Supabase UUID after authentication and reset analytics identity after logout.
- Document environment variables, event schema, and runtime verification.

## Constraints

- Expo SDK 57 and Expo Router conventions remain authoritative.
- Use pinned `pnpx expo@57.0.18 install`; pnpm remains the project package manager and `npx` is
  explicitly excluded by user preference.
- Do not enable touch, route, session-replay, or native-crash autocapture.
- Do not capture onboarding copy, email, or other PII.
- Missing PostHog credentials must not log SDK errors, block navigation, or create network traffic.
- Do not run `pnpm lint` until ESLint is deliberately configured.
- TDD mode: not configured; no test framework or test runner exists. Use TypeScript, export builds,
  focused static inspection, and later Event Debugger verification.
- Keep each authored work unit cohesive; the 400-line guideline is advisory, not a code-golf target.

## Authorized Scope

The user explicitly authorized manual events on every onboarding step and requested that the
integration be ready for credentials later.

## Tasks

- [x] **PH-001 — Add optional PostHog infrastructure and identity lifecycle**
  - Install the SDK and Expo peer dependencies.
  - Mount the official provider only when a project token exists; otherwise expose no-op analytics.
  - Identify authenticated sessions by Supabase UUID and reset identified state on logout without
    rotating an already-anonymous ID at every cold launch.
  - Acceptance: the app works without credentials; with credentials, pre-login events are anonymous,
    login identifies the same journey, and logout returns to a fresh anonymous identity.
  - Checks: TypeScript; focused provider and identity inspection.

- [x] **PH-002 — Instrument the manual onboarding funnel**
  - Add stable step IDs and emit `onboarding started`, `onboarding step viewed`, and
    `onboarding completed` with non-PII properties.
  - Deduplicate step views across button-driven scroll plus momentum callbacks and guard completion
    against repeated taps.
  - Acceptance: one start per onboarding mount, one view per reached step per mount, and one
    completion before navigation to the paywall.
  - Checks: TypeScript; focused event and deduplication inspection.

- [x] **PH-003 — Document and verify the credential-ready integration**
  - Document required public variables, manual-only behavior, event schema, and Event Debugger checks.
  - Acceptance: a developer can add PostHog credentials without changing source code and can verify
    the ordered onboarding funnel.
  - Checks: TypeScript; iOS Expo export; repository diff and documentation inspection.

## Progress

- Exploration completed against Expo SDK 57 environment and analytics guidance, current PostHog
  React Native documentation, and the repository's routing/authentication structure.
- PH-001 complete: PostHog and Expo peers are installed, the provider is not instantiated without a
  project token, automatic capture features are disabled, and identity follows the Supabase session.
- PH-002 complete: placeholder slides now emit stable manual start, reached-step, and completion
  events, with shared guards against duplicate button, momentum, and final-tap captures.
- PH-003 complete: README describes configuration, event schema, privacy boundaries, and Event
  Debugger verification.

## Verification Evidence

- PH-001: pinned `pnpx expo@57.0.18 install ...` completed successfully.
- PH-001: `pnpm exec tsc --noEmit` passed.
- PH-001: focused inspection confirmed static Expo environment-variable access, conditional SDK
  construction, manual-only provider configuration, UUID identification, and guarded logout reset.
- PH-002: `pnpm exec tsc --noEmit` passed.
- PH-002: focused inspection confirmed each event has only stable non-PII properties and that the
  same seen-step set is used by button and momentum navigation.
- PH-003: `pnpm exec tsc --noEmit` passed.
- PH-003: `pnpm exec expo export --platform ios --output-dir /tmp/boiler-plate-expo-posthog-ios-export`
  passed, bundling 1,845 modules.
- PH-003: README inspection confirmed PostHog credentials, manual-only defaults, event semantics,
  identity lifecycle, and Event Debugger procedure are documented.
- Pending cleanup: an earlier failed installation attempt created an untracked `.pnpm-store/`
  directory; it is not part of the implementation and has not been deleted without approval.

## Next Step

Configure PostHog credentials and validate the documented Event Debugger sequence on a physical
development build. The local `.pnpm-store/` artifact can be removed if the user authorizes cleanup.
