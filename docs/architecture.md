# ReelCount Architecture (Provisional)

Status: initial design for the opt-in tracking feasibility prototype. Product architecture choices remain subject to measurement and review.

## Goals

- Build an Android app with a React Native/TypeScript UI and a Kotlin native tracking component.
- Measure whether accessibility event metadata can identify candidate short-video transitions in each supported app.
- Keep collection minimal and local. Make opt-in and stop controls explicit.
- Preserve app-wise daily counts and analytics only after the candidate-transition signal is validated.

## System boundaries

```text
React Native UI
  ├─ Dashboard / history / limits / settings
  ├─ Disclosure and opt-in flow
  └─ Typed native module bridge
       └─ Kotlin tracking module
            ├─ AccessibilityService (four-package filter)
            ├─ Event metadata allowlist
            ├─ Pure transition reducer (candidate signal only)
            └─ Ephemeral diagnostic buffer (prototype only)

Future local aggregate store (not part of the approved prototype)
```

The accessibility service is not the UI and does not inspect or control target applications. It must not collect text, view-tree content, screenshots, passwords, messages, or unrelated application content.

## Prototype data contract

The approved ephemeral trace is restricted to:

- `eventType`: Android accessibility event type integer or stable symbolic name.
- `packageName`: only a verified package name among the four supported apps.
- `timestamp`: monotonic event time for ordering and latency measurement.

No raw `AccessibilityEvent` instance, event text, content description, node identifier, screen content, account identity, or trace persistence. Prototype diagnostics should remain in memory and be discarded when the process ends or tracking is disabled. Any change to this allowlist requires renewed owner review.

A pure reducer may combine signals and debounce bursts, but it emits a `CandidateTransition`, not a confirmed unique reel identity. Its rules and timing are experimental parameters. The UI and reports must state that counts are under validation.

## Foreground and lifecycle behavior

- Track only while the user has explicitly enabled the service and the filtered target package is active.
- Clear transient reducer state when the target package loses foreground or the service disconnects.
- Do not infer a session from arbitrary background events.
- Record only the allowed fields during tests; evaluate service disconnect/reconnect, screen off/on, and target app lifecycle on devices.
- Keep the service disabled until the disclosure/consent step is completed and the user proceeds to Android system settings.

## Future persistence boundary

Persistent aggregate counts are out of the approved first-prototype scope. Before adding them, define an event/count schema, retention/deletion behavior, timezone/day-boundary rules, and migration strategy. Candidate entities to evaluate include daily app totals and user-configured limits. Choose the local database only after the implementation stack and query needs are reviewed; SQLite is a candidate, not a settled decision.

## Measurement before product claims

Test Instagram Reels, TikTok, Snapchat Spotlight, and YouTube Shorts separately, recording app version, Android version, device, scenario labels, and service configuration. Compare candidate signals with independent ground truth for precision, recall, duplicates, misses, latency, and event volume. Include swipes, autoplay, overlays, failed loads, app switching, screen off/on, and service lifecycle. Do not present one app's result as evidence for another.

The first run must not query accessibility UI trees. If event metadata proves inadequate, tree access is a separate privacy and product decision requiring explicit owner approval and a new review.

## Decisions still open

- Minimum and maximum supported Android API levels and test device coverage.
- Verified package identifiers on the test devices.
- Exact operational definition for a counted transition (including autoplay and failed loads).
- Persistence technology, schema, retention, timezone behavior, and user deletion controls.
- Production disclosure text, onboarding UX, and current Google Play declarations/listing requirements.
- Whether measured per-app accuracy supports any count claim or requires narrowing support.
