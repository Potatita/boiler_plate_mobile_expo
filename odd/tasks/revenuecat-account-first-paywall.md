# RevenueCat Hard-Paywall-First Flow

## Objective

Support two explicit entry paths without allowing unpaid access: new users complete the anonymous
paywall before login, while existing-account users authenticate first and only then resolve their
identified RevenueCat entitlement.

## Problem

The previous correction forced every signed-out user through the anonymous paywall, including users
who selected “I already have an account”. Existing users need direct access to login so their
premium state can be checked against the authenticated UUID.

## Why

The acquisition path keeps its hard paywall before login, but account recovery must not require a
second anonymous purchase. Premium application access remains protected after authentication by
the identified entitlement.

## Scope

- Keep the acquisition path onboarding → anonymous paywall → sign-in while allowing the explicit
  existing-account path to open sign-in directly.
- Configure RevenueCat anonymously when no Supabase session exists.
- Transition to the Supabase UUID with `logIn()` and back to a fresh anonymous customer with
  `logOut()`, deriving entitlement from each returned `CustomerInfo`.
- Keep identity transitions serialized and fail closed.
- Update documentation for the hard-paywall-first flow, restore behavior, and alias edge cases.
- Route “I already have an account” directly to sign-in and evaluate its premium state only after
  successful authentication.

## Constraints

- Expo SDK 57 file-based routing and `Stack.Protected` remain the navigation authority.
- RevenueCat Paywall Builder remains the paywall UI.
- Missing credentials must degrade without crashing.
- No backend implementation is in this repository; webhook requirements remain documented.
- Do not run `pnpm lint` until ESLint is deliberately configured.
- TDD mode: disabled/unknown; no test framework or configured test runner exists. Use focused type checking and static inspection.

## Authorized Scope

The user explicitly requires the new-user acquisition path to keep its hard paywall before login.
They clarified that “I already have an account” is the intentional exception: it opens login
directly, then the identified entitlement decides between the app and authenticated paywall.

## Tasks

- [x] **PAY-001 — Restore the hard-paywall-first navigation contract (superseded by PAY-004)**
  - Reopened because the account-first route violated the explicit product requirement.
  - Route onboarding to the public paywall and make sign-in reachable only while the anonymous
    entitlement is active.
  - Acceptance: direct links cannot bypass the paywall to reach sign-in; authenticated users remain
    routed by entitlement through the root protected stack.
  - Checks: route reference search; TypeScript check.

- [x] **PAY-002 — Make mixed anonymous and identified identity atomic**
  - Reopened because custom-ID-only mode cannot support purchases before login.
  - Configure anonymous access for signed-out users, use `logIn` after authentication, and use
    `logOut` after application logout to create the next anonymous customer.
  - Fail closed on every transition, derive state from returned `CustomerInfo`, and register
    listeners only after the target identity is ready.
  - Acceptance: purchases happen only under the current anonymous customer before login, and stale
    anonymous or identified entitlements cannot cross transitions.
  - Checks: TypeScript check; focused static review of async cleanup and user-keyed readiness.

- [x] **PAY-003 — Document and verify the corrected production contract**
  - Reopened because the account-first documentation is now invalid.
  - Document anonymous purchase, post-purchase login, Restore Behavior, the RevenueCat alias edge
    case, Paywalls V2 close-button requirements, and webhook alias handling.
  - Acceptance: docs describe the hard-paywall-first flow honestly without claiming every
    anonymous purchase always merges.
  - Checks: TypeScript check; repository diff review; document/reference search.

- [x] **PAY-004 — Split new-user and existing-account entry paths**
  - Keep onboarding → anonymous paywall → login for new users.
  - Route “I already have an account” directly to login and keep sign-in publicly reachable.
  - After authentication, retain the root identified-entitlement guards that choose `(app)` or
    `subscribe`.
  - Acceptance: existing users never purchase anonymously merely to log in; new users still receive
    the pre-login paywall; neither path can enter `(app)` without identified entitlement.
  - Checks: route inspection; TypeScript check.

- [x] **PAY-005 — Document and verify the two-path contract**
  - Update README language that incorrectly says login is unreachable before anonymous entitlement.
  - Acceptance: documentation distinguishes acquisition gating from authenticated premium gating.
  - Checks: TypeScript check; iOS export; reference search.

## Progress

- Exploration completed against Expo SDK 57, Expo Router protected routes, RevenueCat customer identity, restore behavior, and the installed RevenueCat 10.10.0 APIs.
- PAY-001 complete: onboarding now ends at sign-in, the public paywall route was removed, and SessionProvider no longer owns RevenueCat identity side effects.
- PAY-002 complete: RevenueCat configures with the authenticated UUID, serializes account switches, returns authoritative CustomerInfo to the entitlement provider, and blocks paywall rendering on synchronization errors.
- PAY-003 complete: the README now documents the account-first flow, protected-route boundary, Restore Behavior, Paywalls V2 close-button setup, and webhook responsibility.
- Requirement correction: the user rejected account-first. PAY-001 through PAY-003 were reopened;
  their earlier evidence is retained as superseded implementation history.
- Corrected PAY-001 complete: onboarding and the existing-account action lead to the paywall, while
  nested public `Stack.Protected` guards expose sign-in only after anonymous entitlement.
- Corrected PAY-002 complete: one serialized lifecycle now configures anonymous or identified,
  applies `logIn` after authentication, applies `logOut` after sign-out, and derives entitlement
  from the returned identity-specific `CustomerInfo`.
- Corrected PAY-003 complete: documentation now defines paywall-before-login as invariant, explains
  the alias recovery case and Restore Behavior, and documents webhook reconciliation for anonymous
  IDs and transfers.
- Requirement clarification: existing accounts are an explicit login-first branch. Added PAY-004
  and PAY-005 without invalidating the mixed RevenueCat identity lifecycle.
- PAY-004 complete: signed-out welcome/onboarding/sign-in remain reachable, only the acquisition
  paywall is removed after anonymous entitlement, and successful purchase/restore advances to
  sign-in.
- PAY-005 complete: README now distinguishes new-user acquisition gating from existing-account
  login and authenticated premium gating.

## Verification Evidence

- PAY-001: `pnpm exec tsc --noEmit` passed.
- PAY-001: focused reference search confirmed no public `/paywall` navigation or screen declaration and no RevenueCat identity calls remain in SessionProvider.
- PAY-002: `pnpm exec tsc --noEmit` passed.
- PAY-002: focused lifecycle search confirmed one identified `Purchases.configure` call path and no `logOut`, anonymous reset, or legacy identity helpers.
- PAY-002: static inspection confirmed entitlement and errors are keyed to the current user, with fail-closed loading during identity changes and retry before mounting the paywall.
- PAY-003: `pnpm exec tsc --noEmit` passed.
- PAY-003: `pnpm exec expo export --platform ios --output-dir <temporary directory>` completed successfully with 1,647 modules bundled.
- PAY-003: focused documentation/reference search found no stale public paywall route or claim that an anonymous purchase always transfers.
- Pending external verification: authenticated sandbox purchase, restore, relaunch, and account-switch scenarios require configured Supabase/RevenueCat projects and dashboard access.
- Corrected PAY-001: `pnpm exec tsc --noEmit` passed and route inspection confirmed that
  `/sign-in` is protected by anonymous entitlement.
- Corrected PAY-002: `pnpm exec tsc --noEmit` passed.
- Corrected PAY-002: lifecycle inspection confirmed configure/logIn/logOut are serialized, state is
  keyed as `anonymous` or `user:<uuid>`, and both public and authenticated paywalls block on
  identity errors with an explicit retry.
- Corrected PAY-003: `pnpm exec tsc --noEmit` passed.
- Corrected PAY-003: iOS Expo export completed successfully with 1,648 modules bundled.
- Corrected PAY-003: route/reference inspection confirmed both `/sign-in` and `(app)` are protected
  by the appropriate anonymous or authenticated entitlement.
- Pending external verification: fresh anonymous purchase, pre-login restore, existing-ID alias
  recovery, sign-out to fresh anonymous identity, account switching, and webhook reconciliation
  require configured sandbox services.
- PAY-004: `pnpm exec tsc --noEmit` passed.
- PAY-004: route inspection confirmed “I already have an account” opens `/sign-in`, onboarding
  opens `/paywall`, and root guards still select `(app)` versus `subscribe` only after session
  identity resolution.
- PAY-005: `pnpm exec tsc --noEmit` passed.
- PAY-005: iOS Expo export completed successfully with 1,648 modules bundled.
- PAY-005: reference search found no active documentation claiming that every login is behind the
  anonymous paywall.

## Next Step

Run the two-path sandbox matrix after external services are configured.
