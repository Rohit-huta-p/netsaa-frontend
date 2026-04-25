# Profile Edit Modal — 2-Context Reframe + UX Polish (Option B)

**Date:** 2026-04-25
**Owner:** Rohit
**Status:** Spec — pending implementation plan

## Problem

`ProfileEditModal` (`src/features/profile/components/ProfileEditModal.tsx`) ships two
defects and one architectural mismatch with PRD v4 §6 (two-context model):

1. **Display Name is unreachable.** `ProfileScreen.tsx:696` always passes
   `isOrganizer={true}`. The modal's Basic tab swaps Display Name → Organization
   Name when `isOrganizer` is truthy (line 248-249), so the owner never sees a
   Display Name input. The save call still sends `displayName: ''`, silently
   blanking the name on the server when other Basic fields change.
2. **Focus loss after each keystroke.** The `Input` primitive is declared
   inside the parent component (line 94), so every parent re-render unmounts
   and remounts the `<TextInput>`, dropping focus and IME state mid-word.
3. **Role-gated tabs contradict PRD v4.** `Org` and `Billing` tabs only render
   when `isOrganizer === true`. PRD v4 says every authenticated user can act as
   both artist and hirer; context is page-based, not role-gated. The modal must
   reflect this — every user can configure hirer details when they choose to.

## Goals

- Every owner can edit their Display Name, regardless of historic role flags.
- Hirer-side fields (org, billing) are accessible to every user, marked optional.
- Typing into any field never loses focus mid-input.
- Saving feels like one decision, not eight separate decisions.
- Modal feels visibly smoother — animated tab indicator, focus glow, haptic
  feedback, fewer competing accent colors.

## Non-goals

- Architectural rework (Option C inline-edit) — explored via mock route at
  `app/(app)/profile-edit-mock.tsx`, deferred.
- Backend schema changes — `authService.updateProfile` and `updateOrganizer`
  already accept the field set we need.
- Profile **screen** redesign — only the edit modal changes.
- Removing `requireOrganizer` middleware on backend gigs route — already
  shipped (`netsa-backend@7094776`).

## Information Architecture (locked)

Eight flat tabs, all always visible. No `orgOnly` gating. Renames clarify intent.

| # | Tab key   | Label        | Fields                                                       | Notes                                              |
|---|-----------|--------------|--------------------------------------------------------------|----------------------------------------------------|
| 1 | header    | Basic        | **Display Name**, Headline, Artist Type, Location            | Display Name always rendered. Org Name removed.    |
| 2 | about     | Bio          | Bio, Age, Height, Skin Tone                                  | Renamed "About" → "Bio".                           |
| 3 | identity  | Skills       | Skill tags                                                   | Unchanged.                                         |
| 4 | experience| Experience   | Experience entries timeline                                  | Renamed "History" → "Experience".                  |
| 5 | media     | Media        | Profile photo, Gallery, Reels                                | Unchanged.                                         |
| 6 | socials   | Social       | Instagram, YouTube, Spotify, SoundCloud                      | Unchanged.                                         |
| 7 | organization | Org       | **Org Name**, Org Type, Website                              | Always visible. Org Name lives here. "Optional" badge. |
| 8 | billing   | Billing      | Legal Business Name, GST, Address, State, Pincode, Country   | Always visible. "Optional" badge.                  |

`SECTION_TO_TAB` mapping in the modal stays the same; the only additions are
mapping `'header'` → Display Name (no longer conditional on role) and `'organization'`
→ Org Name lookup.

## UX Polish (Option B)

### Smoothness

- **Focus-loss fix** — Hoist `Input`, `Field`, `MiniField` out of the parent
  component to module scope (or split into a dedicated `EditModalPrimitives.tsx`).
  This alone fixes the typing-loses-focus bug.
- **Animated tab indicator** — Replace the bold-text active state with a pill
  that slides between tab positions. Implemented with a single `Animated.View`
  whose `translateX` animates to the active tab's measured `x`. Uses
  `useNativeDriver: true`; layout measured via `onLayout` per tab.
- **Tab content cross-fade** — Wrap the active section render in an
  `Animated.View` whose `opacity` fades 0→1 over 150ms when `activeTab`
  changes. Fade-out the old content first, then mount the new content faded-in.
- **Field focus glow** — Each text input shows an orange border (`P.orange`,
  alpha 0x80) when focused, default `P.border` otherwise. Driven by the
  primitive's local `focused` state.
- **Haptics** — `expo-haptics` (already in package.json):
  - Tab change → `impactAsync('Light')`
  - Save success → `notificationAsync('Success')`
  - Discard prompt → `impactAsync('Medium')`

### Save model

- **Single footer Save** — One CTA: "Save changes". On press:
  - Read every dirty section's draft, fan out to `authService.updateProfile`
    (artist payload merge) and `authService.updateOrganizer` (org/billing
    payload merge) in parallel. At most two PATCH requests regardless of how
    many tabs the user touched.
  - On success, refresh `useAuthStore.user`, clear dirty flags, show a toast
    ("Profile updated"), close after a short delay.
  - On any failure, surface a toast with the failed section name; keep modal
    open with that section's dirty flag intact.
- **Discard prompt** — Closing while dirty triggers a small in-modal bottom
  sheet (not a native `Alert`): "You have unsaved changes. Discard?" with
  Discard / Keep editing buttons. Implemented with the same `Animated.View`
  pattern used for the toast — no new component file needed.
- **Dirty dots on tabs** — A tab's checkmark dot becomes an accent-colored dot
  while dirty (replaces the green-when-complete dot for the duration of the
  edit session). Read from a local `dirtyTabs: Set<TabKey>` derived inside the
  modal — does not need to be promoted to `profileUiStore`.

### Visuals

- **Color simplification** — Drop per-tab accent rainbow. Two accents only:
  - **Orange (P.orange)** for primary actions, focus glow, dirty dots, tab pill.
  - **Gold (P.gold)** for save-success states + the optional-tab "for hirers"
    badge.
  - Section content can keep gentle accent tints in their backgrounds
    (`{accent}06`) for visual grouping, but no high-saturation per-tab branding.
- **Optional badge** — Small uppercase "OPTIONAL · FOR HIRERS" pill next to
  the Org and Billing tab labels, plus a one-line subhead at the top of those
  tab bodies.
- **Full skin-tone palette** — Render all 7 `SKIN_TONES` (currently sliced to
  5). Wraps to a second row if needed.
- **Dropdown sub-sheets** — Height picker and Skill search currently expand
  inline and push surrounding content. Replace with overlay bottom-sheets
  (small `<Modal>` rendered above the edit modal) so the underlying form layout
  doesn't jump.

### Toasts

- Use a lightweight in-modal toast (a positioned `Animated.View` near the
  footer) — slide up + auto-dismiss after 1.8s. No new library; one component
  inside the modal file. Reused for save success, save failure, and discard
  confirmation.

## Save Pipeline (sequence)

```
User taps "Save changes"
  ├─ Compute dirty payloads:
  │    artistPayload  = merge(header, about, identity, experience, media, socials)
  │    organizerPayload = merge(organization, billing)
  ├─ Promise.allSettled([
  │     artistPayload  ? authService.updateProfile(artistPayload)   : noop,
  │     organizerPayload ? authService.updateOrganizer(organizerPayload) : noop,
  │   ])
  ├─ On all-fulfilled → setAuth merge → toast("Profile updated") → close
  ├─ On any-rejected  → toast("Couldn't save <tab label>") → keep modal open
                          (e.g. "Couldn't save Bio" or "Couldn't save Org")
```

`updateProfile` is a single PATCH `/auth/me`. `updateOrganizer` is a single PATCH
`/organizers/me`. Existing endpoints, no contract change needed.

## Component layout

```
ProfileEditModal.tsx                 (orchestrator, ~280 lines after extraction)
  ├─ EditModalPrimitives.tsx         (Field, Input, MiniField — hoisted to fix focus)
  ├─ EditModalTabBar.tsx             (animated pill, dirty/complete dots)
  ├─ EditModalToast.tsx              (slide-up notice)
  └─ tabs/
       ├─ TabBasic.tsx
       ├─ TabBio.tsx
       ├─ TabSkills.tsx
       ├─ TabExperience.tsx
       ├─ TabMedia.tsx
       ├─ TabSocial.tsx
       ├─ TabOrganization.tsx
       └─ TabBilling.tsx
```

The current 625-line single file becomes ~8 ~50-line tab files plus a thinner
orchestrator. Each tab receives `(values, onChange, isFieldMissing)` — no role
flag.

`ProfileScreen.tsx:696` updates: drop the `isOrganizer={true}` prop entirely.
The modal no longer accepts that prop.

## Edge cases

- **User without organizer profile yet.** `authService.updateOrganizer`
  endpoint may 404 if the user has no organizer doc. Backend should auto-create
  one on first PATCH; if not, the save pipeline catches the rejection and shows
  toast "Org details couldn't save". Verify endpoint behavior in plan.
- **Concurrent saves.** Save button disabled while `isSaving === true`.
- **Closing during save.** Block close while saving (button → "Saving…").
- **Stale `profileData` prop.** When `setAuth` updates the store post-save,
  `profileData` derived in `ProfileScreen.tsx` updates → modal `useEffect`
  resets form drafts. Need to guard against resetting drafts while modal is
  still mounted with new dirty edits — only re-hydrate form state when
  `activeSheet` transitions from null → non-null (modal opens).
- **Tab measurement before first paint.** Animated pill needs each tab's
  measured `x`. Default the indicator to 0 until first `onLayout` resolves; no
  visible flash because the tab bar mounts hidden until the slide-in animation
  completes.

## Testing

Unit / interaction tests with `@testing-library/react-native`:

1. **Display Name is editable for any user.** Render with mock authStore user
   (no organizer flag, with organizer flag). Assert Display Name input is
   present in both. Type → assert state propagates.
2. **Focus does not drop mid-typing.** Render Basic tab. Get the Display Name
   input by placeholder. Fire `changeText('A')` → assert still focused.
   Fire `changeText('Aa')` → still focused. (Verifies hoisted primitives.)
3. **Single Save flushes multiple tabs.** Edit Basic + Bio + Org. Tap Save.
   Assert `authService.updateProfile` called once with merged artist payload
   AND `authService.updateOrganizer` called once with merged org payload.
4. **Discard prompt on close-while-dirty.** Edit a field, tap close. Assert
   discard sheet appears. Tap "Keep editing" → modal stays. Tap "Discard" →
   modal closes, drafts cleared.
5. **Dirty dot on tab.** Edit Basic. Switch to Bio tab. Assert Basic tab
   header shows dirty dot.
6. **Optional badges render.** Open modal. Assert "Optional" badge next to
   Org and Billing tabs. Assert no `orgOnly` gating skips them.
7. **Toast on save success/failure.** Mock services. Success → toast
   "Profile updated". Reject one → toast with failed section name.

Smoke test (existing): mounts modal, asserts header tab visible, asserts no
crash. Lift to verify all 8 tabs render in the new world.

## Risks

- **File extraction size.** Splitting a 625-line file into 12 files is busywork
  but reduces re-render surface and makes future changes trivial. Risk is
  cosmetic regressions (lost `style` props during cut/paste). Mitigate with
  careful diff review + smoke test.
- **Animation perf.** Tab pill + content fade run together on tab change.
  Native driver compatible; should land at 60fps. Verify on lower-end Android.
- **Save pipeline race.** If user rapidly toggles a field while save is in
  flight, the second `setAuth` could overwrite local edits. Disable inputs
  while saving (mirror `isSaving`).

## Out of scope

- Inline-edit screen (Option C). Mock retained at
  `app/(app)/profile-edit-mock.tsx` until merge; delete once Option B ships.
- Field-level optimistic save (auto-save on blur). Single Save model is the
  agreed mental model for v1.
- Skin tone color picker UI rework — keep current 7-swatch row.
- New profile fields (languages, availability, rate card) — deferred.

## Cleanup tasks

- Delete `app/(app)/profile-edit-mock.tsx` after Option B lands.
- Remove `isOrganizer` prop from `ProfileEditModal` consumer in
  `ProfileScreen.tsx` (line 696) and from the modal's `Props` interface
  (currently `type Props = { profileData: ProfileData; isOrganizer: boolean; }`
  → `type Props = { profileData: ProfileData; }`).
- Remove `orgOnly` field from `TabDef` and the `visibleTabs` filter that uses it.
- Remove now-unused `SECTION_TO_TAB.contact` if no caller still passes
  `'contact'` as a section id (`grep openSheet.*contact` first).
