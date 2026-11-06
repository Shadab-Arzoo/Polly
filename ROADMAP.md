# ReelCount Development Roadmap

Last updated: 2026-11-07

## Project state

This workspace began as an empty Git repository with no remote refs. The project owner approved using it for ReelCount, creating a documentation baseline and initial commit, and holding remote pushes until independent review. This is not an existing ReelCount application codebase.

The project owner approved an opt-in, app-filtered AccessibilityService feasibility prototype limited to ephemeral event type, package name, and timestamp metadata. No text, UI-tree access, screenshots, or trace persistence are in scope. The feasibility investigation found Android AccessibilityService is suitable for measurement, but per-app transition detection is unverified. No target social app was tested on a device. Product claims of reliable counting must wait until per-app device measurements establish precision, recall, duplicate/missed rates, and latency.

## Provisional architecture direction

- React Native with TypeScript for the user interface and navigation.
- A narrowly scoped Kotlin AccessibilityService prototype, gated behind explicit user enablement and a clear disclosure/consent flow.
- Start with allowlisted event metadata and verified package names; do not inspect text, UI trees, screenshots, messages, passwords, or unrelated app content.
- A pure transition reducer should turn event bursts into candidate transitions. Its rules and debounce interval are experimental parameters to measure, not assumed guarantees.
- Persist aggregate counts only after the measurement prototype validates a useful signal. Evaluate SQLite/local storage selection and retention as a design task.
- Make app support individually configurable and tracking limitations visible.
- Do not claim the app is an accessibility tool. Before release, verify current Play declaration, disclosure, affirmative consent, listing, and sensitive API requirements.

The owner has approved using this repository and the limited event-only prototype described in `docs/architecture.md`. This approval does not extend to UI-tree access, trace persistence, production tracking claims, or Play release. Obtain renewed owner review before expanding collection or making those decisions.

## Phases and dependencies

1. **Repository and project bootstrap** — confirm the correct remote and provide a committed base. Required before worktrees, implementation branches, or PRs.
2. **Technical design and consent boundary** — define the counted transition, OS support range, package identifiers, local data schema/retention, disclosure, and opt-in flow. Required before product tracking implementation.
3. **Tracking feasibility prototype** — event-only Kotlin prototype; manually label ground truth and measure all four target apps across OS/app versions and lifecycle/overlay scenarios. Do not promise exact counts.
4. **Parallel product work** — after interfaces and permission decisions are approved: React Native dashboard; native tracking; persistence/analytics; settings/limits/reminders. Each task gets a separate worktree, disjoint file ownership, an implementer PR, and independent different-vendor review.
5. **Integration and verification** — Android build, automated tests, and integration of reviewed PRs by the human. Polly does not merge.
6. **Physical-device validation** — accuracy, lifecycle, persistence, battery, permission and disclosure behavior on real devices.
7. **Release preparation** — APK and policy review, with known platform/app-version limitations documented.

## Development task board

Statuses reflect actual dispatch and completion reports. No implementation agent is currently working in an isolated worktree.

| ID | Task | Assigned agent | Status | Priority | Progress / current activity | Dependencies | Files being modified | Test status | Blockers |
|---|---|---|---|---|---|---|---|---|---|
| RC-001 | Inspect repository and Git state | Antigravity (agy) | DONE | P0 | Confirmed empty repository; no files, commits, or remote refs; no conventions | None | None (read-only) | Not applicable | None |
| RC-002 | Assess AccessibilityService feasibility and prototype plan | Codex | DONE | P0 | Event-based prototype is feasible to measure; accuracy unproven and no device testing performed | None | None (read-only) | Not applicable | Physical Android devices and app versions needed for empirical validation |
| RC-003 | Confirm repository/bootstrap target and usable Git base | Project owner | DONE | P0 | Owner approved using this empty checkout for ReelCount and a local documentation baseline commit | RC-001 | README.md, .gitignore, ROADMAP.md, docs/architecture.md, .polly/registry.json | Not applicable | Initial commit approved; no remote pushes until independent review |
| RC-004 | Approve limited prototype disclosure/consent and event scope | Project owner + technical lead | DONE | P0 | Owner approved opt-in service, four-app filtering, ephemeral event type/package/timestamp only; no text/tree/screenshots/persistence | RC-002, RC-003 | docs/architecture.md | Not applicable | Production tracking and scope expansion remain unapproved |
| RC-005 | Define architecture, event contract, schema, and support matrix | Technical lead + Codex | IN REVIEW | P1 | Provisional module boundaries and prototype event allowlist documented; persistence and support details remain open | RC-003, RC-004 | docs/architecture.md | Not applicable | Database and production support decisions await prototype data |
| RC-006 | Build event-only Android tracking prototype | Codex | BLOCKED | P1 | Local implementation commit complete; JS lint/typecheck/test and Android unit/build gates pass; independent reviewer failed to launch | RC-003, RC-004, RC-005 | 49 paths on branch `polly/rc-006-codex`; see local commit `2d126bb8c07af01ae93f26d0b7e449703fa1b57d` | PASS: JS and Android build/unit gates; device behavior unverified | No available different-vendor reviewer; no device transition validation |
| RC-007 | Prototype validation in Instagram, TikTok, Snapchat Spotlight, YouTube Shorts | Owner/device tester + Codex | BACKLOG | P1 | Test matrix defined; no device runs yet | RC-006 | Test notes/results TBD | Not started | Physical devices and installed target apps |
| RC-008 | React Native dashboard and navigation | Antigravity (agy) | BACKLOG | P2 | Not started; ownership/interface to be set after architecture | RC-003, RC-005, RC-007 | TBD | Not started | No project base; depends on interfaces |
| RC-009 | Local persistence and daily/weekly/monthly analytics | Codex or Antigravity (agy) | BACKLOG | P2 | Not started; schema and ownership to be set in design | RC-003, RC-005, RC-007 | TBD | Not started | No project base; depends on validated data contract |
| RC-010 | Per-app settings, limits, reminders, permission and privacy screens | Antigravity (agy) | BACKLOG | P2 | Not started; disclosure decision required | RC-003, RC-004, RC-005 | TBD | Not started | No project base; consent requirements unresolved |
| RC-011 | Integration, test/build gates, and independent reviews | Codex + different-vendor reviewer | BLOCKED | P1 | Local gates pass; Antigravity review dispatch failed before the reviewer received the task | RC-006 through RC-010 | Diff snapshot `/tmp/reelcount-rc006.diff` | JS and Android gates passed; physical-device checks pending | Only available independent reviewer failed to launch; no push/PR until review decision |
| RC-012 | Physical-device lifecycle, battery, and release/policy validation | Owner/device tester + Codex | BACKLOG | P1 | Not started | RC-007, RC-011 | Results/docs TBD | Not started | Device access and current Play policy review |

## Feasibility test matrix

For each target app and tested app version, independently label each manual action and record only allowlisted event metadata:

- Swipe to next video; autoplay; pause/resume; partial/repeated swipe; delayed or failed load.
- Open/close comments, profile, share sheet, system shade/dialog; navigate away and return.
- Enter/leave app; screen off/on; service disable/re-enable; process reclaim/reconnect.
- Compare service enabled/disabled; begin without retrieving window content; check compatibility with TalkBack.
- Report per-app precision, recall, duplicate and missed transitions, event-to-count latency, and event volume.

Record device model, Android version, app version, and test configuration. Keep prototype traces ephemeral and avoid content-bearing fields. Do not combine results across apps or versions in a way that hides failures.

## Separate Polly harness request

The owner also requested a GitHub Copilot CLI harness as a Polly worker. This checkout contains ReelCount, not Polly orchestration/runner source, and the session dispatcher does not expose a Copilot worker. A separate investigation found that implementing this requires the actual Polly orchestrator/runner repository and host CLI/auth setup. The correct Polly source location is pending from the owner.

## Project-management interface

No live Jira-style board API or agent-activity event stream is available in this session. This Markdown board is the current human-readable source of project status. Statuses are updated from actual dispatch and completion reports; this is not an automatically live dashboard.
