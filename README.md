# ReelCount

ReelCount is an Android application concept for helping people notice short-form video scrolling across Instagram Reels, TikTok, Snapchat Spotlight, and YouTube Shorts.

## Project status

This repository is being bootstrapped. The current committed baseline is project documentation only; the Android/React Native application has not yet been implemented. The first technical milestone is an opt-in, event-only tracking feasibility prototype. Counting accuracy must be measured on physical devices before any reliability claim is made.

See [ROADMAP.md](ROADMAP.md) for phases and the task board, and [docs/architecture.md](docs/architecture.md) for the provisional design and prototype boundary.

## Proposed stack

- React Native and TypeScript for the Android app UI.
- Kotlin Android AccessibilityService prototype, limited to explicitly enabled supported apps and allowlisted event metadata.
- Local persistence for aggregate counts after feasibility is demonstrated and the schema is reviewed.
- React Native and TypeScript for the initial Android screen.

## Privacy boundary for the first prototype

The approved prototype scope is opt-in, app-filtered event measurement that may retain only event type, package name, and timestamp in ephemeral traces. It must not read text or accessibility UI trees, capture screenshots, collect messages/passwords, or persist traces. Do not treat the prototype as a production tracker or as an accessibility tool.

## Build instructions

Install Node.js (22.11 or newer), JDK 17, Android Studio and the Android SDK, then install JavaScript dependencies:

```sh
npm install
npm run start
```

In another terminal, with an Android emulator or device available:

```sh
npm run android
```

Checks available without a device:

```sh
npm run lint
npm run typecheck
npm test -- --runInBand
cd android && ./gradlew :app:testDebugUnitTest :app:assembleDebug
```

The package identifiers in the service configuration are provisional. Installed package names, app versions, and event-transition accuracy have not been verified on physical devices. The prototype's candidate transitions are experimental and must not be presented as reliable counts.

### Installing a pre-release APK

The release variant is a pre-release, debug-key-signed APK for tester installation. It does not request network access. React Native Metro's network permission is added only to the debug variant.

On Android 13 and newer, Android may block Accessibility access for apps installed outside an app store. If the ReelCount service is unavailable or disabled in Accessibility settings, open **Settings → Apps → ReelCount (Pre-release) → ⋮ → Allow restricted settings**, confirm the system prompt, then return to **Settings → Accessibility → Installed apps → ReelCount (Pre-release)** and enable it. Menu labels may vary by device. Only allow restricted settings for apps you trust. See [Google's Android Help](https://support.google.com/android/answer/12623953).
