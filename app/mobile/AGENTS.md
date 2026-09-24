# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

SDK was downgraded from 57 to 54 (2026-07-16) to match every other demo app's Expo Go
client version on this server (see docs/demo-apps-task.md §9). Do not bump past 54.x
without updating Expo Go on the test devices and confirming compatibility first.

# npm install needs --legacy-peer-deps

A hoisted `react-dom@19.2.7` (pulled in transitively, not a direct dependency here) wants
`react@^19.2.7`, but this project pins `react@19.1.0` to match SDK 54. Plain `npm install`
and `npx expo install <pkg>` both fail with ERESOLVE because of it — run
`npm install --legacy-peer-deps` instead. This is unrelated to whatever package you are
adding; the conflict is already in the lockfile.

# Shared code lives in app/web/src/shared

Types, API calls, query keys/invalidation, schedule/task/timer logic and UI copy are shared
with the web app and imported as `@shared/*` (tsconfig `paths` + `metro.config.js`
`watchFolders`). Change behaviour there, not by forking it here, so Web / iOS stay identical.
Never import npm packages from that directory (it would resolve against app/web/node_modules).
The Apple Watch targets can't import TypeScript: the default duration, result options and copy
are mirrored in `targets/_shared/Models.swift` / `Copy.swift` — update both together.

# Watch targets need @expo/prebuild-config at the top level

`@bacons/apple-targets` 4.x requires `@expo/prebuild-config` from its own location; SDK 54 only
ships it nested under `expo/`, so it is pinned as a devDependency (`~54.0.9`). Removing it breaks
`expo prebuild` and silently drops the watch app from iOS builds.
