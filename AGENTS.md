# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Package manager: pnpm

This project uses **pnpm**. Never run `npm install` or `yarn add` here — they will create a
competing lockfile and desync `pnpm-lock.yaml`.

- Add an Expo SDK package with `npx expo install <pkg>`, which resolves the version that
  matches this SDK and delegates to pnpm.
- Add a non-Expo package with `pnpm add <pkg>`.
- Commit `pnpm-lock.yaml` with the change that caused it.
- `pnpm lint` currently auto-bootstraps ESLint (this repo has no ESLint config) and then
  fails on pnpm's ignored-builds policy, leaving the lockfile dirty. Do not run it until
  ESLint is set up deliberately.

## Follow the framework's conventions

Always implement features the way the framework officially recommends, not with a
workaround that happens to work. Framework-native patterns are the ones the runtime is
optimized for — they get the built-in performance work, and hand-rolled alternatives
opt out of it and decay on every upgrade.

Concretely:

- Routing is file-based under `src/app/`. A file is a screen and its path is its URL.
  Non-navigation code (components, hooks, constants) lives outside `src/app/`.
- Use `_layout.tsx` for anything persistent: navigators, providers, theme, fonts.
- Use `(group)` folders to share a layout without changing the URL.
- Gate authenticated areas declaratively with `<Stack.Protected guard={...}>`. Let route
  state follow session state; do not push the user around with imperative
  `router.replace` calls after login.
- If a convention seems to not fit, re-read the versioned docs before inventing a
  workaround. Hidden routes, manual redirects, and ad-hoc navigation flags are signals
  that the structure is wrong, not that the framework is missing something.
