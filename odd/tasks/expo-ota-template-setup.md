# Expo OTA Template Setup

## Objective

Prepare the reusable Expo SDK 57 boilerplate with the SDK-matched `expo-updates`
dependency and clear instructions for each generated app to connect its own EAS
project and publish OTA updates.

## Problem

The starter currently has no `expo-updates` dependency or EAS Update guidance. A
single EAS project ID cannot be embedded as the destination for every app made
from this reusable template.

## Why

The user wants downstream apps created from this boilerplate to adopt OTA without
sharing an EAS Update project or release channel with unrelated apps.

## Scope

- Add the SDK-compatible `expo-updates` package using the repository's pnpm and
  pinned Expo CLI convention.
- Add generic `appVersion` runtime policy and EAS preview/production build
  profiles without an EAS project ID or project-specific update URL.
- Document per-app EAS project linking/configuration, preview build/testing,
  production promotion, and native-change boundaries.

## Constraints

- Use pnpm/pnpx only; never use npm, yarn, or npx.
- Follow exact Expo SDK 57 documentation and existing repository conventions.
- Do not create/link an EAS project or publish remotely for this template.
- Do not commit a shared `extra.eas.projectId` or `updates.url`.
- Preserve unrelated working-tree changes; do not run `pnpm lint` because ESLint
  is not configured.
- TDD mode is not configured and the project has no test script; use ordinary
  functional/static checks appropriate to package/config/docs changes.

## Authorized Scope

The user explicitly authorized adding OTA dependency and documentation so future
apps generated from this boilerplate can attach their own EAS project.

## Acceptance Criteria

- `expo-updates` is installed at the SDK-compatible version and `pnpm-lock.yaml`
  is synchronized.
- The shared template contains only generic OTA runtime/channel configuration;
  EAS project identity and update URL remain per generated app.
- The README explains how to link/create an EAS project, configure EAS Update,
  build and test a preview, publish/promote updates, and when a store build is
  required.
- Static/config/export checks pass, or unavailable checks are reported honestly.

## Tasks

- [x] **OTA-001 — Add generic OTA dependency and config scaffolding**
  - Install `expo-updates` with the pinned Expo 57 CLI through pnpm.
  - Set `runtimeVersion.policy` to `appVersion` and add preview/production
    channels in `eas.json`.
  - Keep `extra.eas.projectId` and `updates.url` out of the shared template.
  - Checks: frozen-lockfile installation; Expo public config inspection;
    TypeScript check.

- [x] **OTA-002 — Document per-app EAS Update onboarding and release flow**
  - Add a concise README section with pnpm-native commands for authentication,
    linking/creating each app's EAS project, `update:configure`, preview build,
    OTA test, production promotion/rollback, and native-change caveat.
  - State that each generated app owns a distinct EAS project ID and document
    the environment-variable requirements for SDK 57 updates.
  - Checks: review rendered Markdown and verify documented commands/flags
    against official Expo SDK 57/EAS documentation.

## Progress

- Exploration confirmed the repo is on Expo SDK `~57.0.18`, uses pnpm, has no
  `expo-updates`, `eas.json`, runtime version, or EAS project ID, and has no
  configured test runner/TDD mode.
- This plan intentionally prepares generic OTA support; actual EAS project
  creation/linking and remote publishing remain per downstream app.
- OTA-001 complete: installed `expo-updates@~57.0.23`, added the generic
  `appVersion` runtime policy and preview/production channels, and left the
  project ID/update URL unset. No remote EAS project was created or linked.
- OTA-002 complete: documented per-generated-app EAS setup, preview validation,
  production promotion/rollback, environment variables, and native-build limits
  in `readme.md`.

## Verification Evidence

- OTA-001: `pnpm install --frozen-lockfile` passed.
- OTA-001: `pnpm exec expo config --type public` passed; output resolves SDK
  57.0.0 with the `appVersion` runtime policy and no project-specific EAS ID or
  update URL.
- OTA-001: `pnpm exec tsc --noEmit` failed on the pre-existing untracked
  `src/components/ios-popover-demo.ios.tsx`, which imports the missing
  `expo-ios-popover` module. This is outside the authorized OTA scope.
- OTA-001: `pnpx expo@57.0.18 install --check` was attempted but failed in
  offline mode while reporting existing Expo package version drift; it did not
  flag `expo-updates`.
- OTA-001: `pnpm lint` not run because the repository instructions prohibit it
  until ESLint is configured.
- OTA-002: `git diff --check -- readme.md` passed; Markdown fence and required
  command/content assertions passed. Documentation links/commands were checked
  against Expo SDK 57 and current EAS documentation; no renderer was run.
- Final config/docs assertions passed: dependency version, appVersion runtime
  policy, absence of template-specific project ID/update URL, preview/production
  channel values, and onboarding/promotion instructions.
- Remote EAS login/link/build/publish and device runtime tests were not run by
  design; they require each generated app's own project and credentials.

## Next Step

The template is ready for downstream apps. Each generated app should follow the
README to attach its own EAS project, create a preview build, and validate an
OTA update before production.

## Relevant Files

- `package.json` — Expo SDK and dependency declarations.
- `app.json` — shared Expo app/runtime configuration.
- `eas.json` — generic EAS preview/production build profiles and channels.
- `readme.md` — onboarding and setup guide, including per-app EAS Update steps.
