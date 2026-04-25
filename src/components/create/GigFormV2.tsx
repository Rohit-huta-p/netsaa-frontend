// netsa-mobile/src/components/create/GigFormV2.tsx
//
// Orchestrator for the new 5-page gig form (Plan 5 Wave 5, Task 16).
// Coexists with the legacy `GigForm.tsx` behind a feature flag; both expose
// the same `GigFormHandle` imperative ref (from `./GigFormTypes`) so the
// parent `create.tsx` route plumbs identically for either.
//
// Scope:
// - Holds all form state in one `useState<GigFormV2State>` (no Zustand —
//   ephemeral, no cross-screen reuse).
// - Renders Page1-Page5 with forward/back navigation and a progress bar.
// - Submits via `useCreateGig().mutateAsync` (create) or
//   `useUpdateGig().mutateAsync` (edit when `gigId` prop is set).
// - Populates from `useGig(gigId)` when editing, following the same
//   `React.useEffect` pattern as the legacy form.
//
// Exports `setByPath` (generic immutable nested-path helper) and
// `buildBackendPayload` (pure state → backend shape transform) so both can
// be unit-tested without mounting the component (eng-review P1 #2, #3).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import dayjs from 'dayjs';
import { useCreateGig, useUpdateGig, useGig } from '@/hooks/useGigs';
import useAuthStore from '@/stores/authStore';
import Page1Identity, { type Page1Value } from './pages/Page1Identity';
import Page2Commitment, { type Page2Value } from './pages/Page2Commitment';
import Page3Fit, { type Page3Value } from './pages/Page3Fit';
import Page4Logistics, { type Page4Value } from './pages/Page4Logistics';
import Page5SafetyReview from './pages/Page5SafetyReview';
import { LeaveGigModal } from './LeaveGigModal';
import type { GigFormHandle } from './GigFormTypes';

const TOTAL_PAGES = 5;
const PAGE_LABELS = ['Identity', 'Commitment', 'Fit', 'Logistics', 'Publish'];

export interface GigFormV2State {
  p1: Page1Value;
  p2: Page2Value;
  p3: Page3Value;
  p4: Page4Value;
  isUrgent: boolean;
  isFeatured: boolean;
}

function initialState(): GigFormV2State {
  return {
    p1: { title: '', artistTypes: [], eventFunction: '' },
    p2: {
      startDate: '',
      city: '',
      compensationModel: 'fixed',
      compensationStructure: 'fixed',
      negotiable: false,
      languagePreferences: [],
    },
    p3: { music: {}, model: {}, visual: {}, crew: {} },
    p4: {
      ancillaryProvided: [],
      mediaRequirements: {
        headshots: false,
        fullBody: false,
        videoReel: false,
        audioSample: false,
        notes: '',
      },
      description: '',
      perks: [],
      termsAndConditions: '',
    },
    isUrgent: false,
    isFeatured: false,
  };
}

// ── Nested state update helper (eng-review P1 #3) ──────────────────
// Writes `value` to the nested path `path` inside an immutable copy of
// `state`, preserving all unrelated sibling keys. Replaces fragile deep
// spreads like `{ ...state, p3: { ...state.p3, music: { ...state.p3.music, bpm } } }`.
//
// Usage: setState(setByPath(state, 'p3.music.bpm', '120'))
export function setByPath<T extends Record<string, any>>(
  state: T,
  path: string,
  value: unknown
): T {
  const keys = path.split('.');
  const clone: any = { ...state };
  let cursor: any = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cursor[k] = { ...(cursor[k] ?? {}) };
    cursor = cursor[k];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone as T;
}

// ── Pure client → backend payload transform ────────────────────────
// Locks the shape Plan 4's Zod schema expects. If this drifts, `createGig`
// 400s with a cryptic error. Covered by `buildBackendPayload.test.ts`.

// Coerce numeric musicDetails fields from string (text-input state) to
// number (Plan 4 Zod expects z.number()). Undefined / empty values pass
// through as undefined. Non-numeric strings (e.g., typo) also become
// undefined — backend refinement catches required-field misses.
function coerceMusicNumeric(input: unknown): number | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;
  if (typeof input === 'string') {
    const n = parseFloat(input);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

// Return type is a backend-ready shape (numbers for numeric fields). Input
// shape carries string form-input values. We intentionally widen to `any`
// to cross the string→number boundary cleanly; callers are `buildBackendPayload`
// only, and its return is typed loosely at the mutation call site.
function coerceMusicDetails(music: GigFormV2State['p3']['music']): Record<string, unknown> {
  return {
    ...music,
    bpm: coerceMusicNumeric(music.bpm),
    turnaroundDays: coerceMusicNumeric(music.turnaroundDays),
    revisionsIncluded: coerceMusicNumeric(music.revisionsIncluded),
    setLengthHours: coerceMusicNumeric(music.setLengthHours),
    bandSize: coerceMusicNumeric(music.bandSize),
  };
}

export function buildBackendPayload(state: GigFormV2State) {
  const compStructure = state.p2.compensationStructure;
  const amount =
    compStructure === 'fixed' && state.p2.amount ? parseInt(state.p2.amount, 10) : undefined;
  const minAmount =
    compStructure === 'range' && state.p2.minAmount ? parseInt(state.p2.minAmount, 10) : undefined;
  const maxAmount =
    compStructure === 'range' && state.p2.maxAmount ? parseInt(state.p2.maxAmount, 10) : undefined;

  return {
    title: state.p1.title,
    artistTypes: state.p1.artistTypes,
    eventFunction: state.p1.eventFunction,
    description: state.p4.description,
    type: 'one-time' as const,
    requiredSkills: state.p3.visual.requiredSkills ?? [],
    experienceLevel: state.p3.visual.experienceLevel ?? 'intermediate',
    genderPreference: state.p3.visual.genderPreference ?? 'any',
    ageRange: state.p3.visual.ageRange,
    heightRequirements: state.p3.visual.heightRequirements,
    location: {
      city: state.p2.city,
      venueName: state.p2.venue,
      address: state.p2.address,
      state: 'Maharashtra',
      country: 'India',
      isRemote: false,
    },
    schedule: {
      startDate: new Date(state.p2.startDate),
      endDate: state.p2.endDate ? new Date(state.p2.endDate) : new Date(state.p2.startDate),
      durationLabel: state.p2.duration ?? '',
      timeCommitment: state.p2.duration ?? '',
    },
    compensation: {
      model: state.p2.compensationModel,
      amount,
      minAmount,
      maxAmount,
      currency: 'INR' as const,
      negotiable: state.p2.negotiable,
      perks: state.p4.perks,
    },
    applicationDeadline: state.p4.applicationDeadline
      ? new Date(state.p4.applicationDeadline)
      : undefined,
    maxApplications: state.p4.maxApplicants ? parseInt(state.p4.maxApplicants, 10) : undefined,
    mediaRequirements: state.p4.mediaRequirements,
    termsAndConditions: state.p4.termsAndConditions,
    musicDetails: coerceMusicDetails(state.p3.music),
    modelDetails: state.p3.model,
    visualDetails: {
      roleType: state.p3.visual.roleType,
      bodyType: state.p3.visual.bodyType,
    },
    crewDetails: state.p3.crew,
    languagePreferences: state.p2.languagePreferences ?? [],
    ancillaryLogistics: { provided: state.p4.ancillaryProvided ?? [] },
    isUrgent: state.isUrgent,
    isFeatured: state.isFeatured,
  };
}

export interface GigFormV2Props {
  onPublish: (data: any) => void;
  onCancel: () => void;
  gigId?: string;
}

const GigFormV2 = React.forwardRef<GigFormHandle, GigFormV2Props>(
  ({ onPublish, onCancel, gigId }, ref) => {
    const { width } = useWindowDimensions();
    const sliderWidth = Math.max(width - 160, 100);

    const [state, setState] = useState<GigFormV2State>(initialState);
    const [page, setPage] = useState(1);
    const [leaveVisible, setLeaveVisible] = useState(false);
    const isNavigatingAway = useRef(false);

    const createMutation = useCreateGig();
    const updateMutation = useUpdateGig();
    const { data: existing } = useGig(gigId ?? '');
    const isLoading = createMutation.isPending || updateMutation.isPending;

    // Populate from existing on edit — mirrors legacy form's
    // `React.useEffect` block (lines 228-290). Runs once when `existing`
    // first resolves for the current `gigId`. We drop into the V2 state
    // shape, not the legacy flat shape.
    useEffect(() => {
      if (!existing || !gigId) return;
      const g: any = existing;
      setState({
        p1: {
          title: g.title ?? '',
          artistTypes: g.artistTypes ?? [],
          eventFunction: g.eventFunction ?? '',
        },
        p2: {
          startDate: g.schedule?.startDate ? dayjs(g.schedule.startDate).format('YYYY-MM-DD') : '',
          endDate: g.schedule?.endDate ? dayjs(g.schedule.endDate).format('YYYY-MM-DD') : '',
          city: g.location?.city ?? '',
          venue: g.location?.venueName ?? '',
          address: g.location?.address ?? '',
          compensationModel: g.compensation?.model ?? 'fixed',
          compensationStructure: g.compensation?.minAmount ? 'range' : 'fixed',
          amount: g.compensation?.amount?.toString() ?? '',
          minAmount: g.compensation?.minAmount?.toString() ?? '',
          maxAmount: g.compensation?.maxAmount?.toString() ?? '',
          negotiable: g.compensation?.negotiable ?? false,
          duration: g.schedule?.timeCommitment ?? g.schedule?.durationLabel ?? '',
          languagePreferences: g.languagePreferences ?? [],
        },
        p3: {
          music: g.musicDetails ?? {},
          model: g.modelDetails ?? {},
          visual: {
            roleType: g.visualDetails?.roleType,
            bodyType: g.visualDetails?.bodyType,
            requiredSkills: g.requiredSkills ?? [],
            experienceLevel: g.experienceLevel,
            genderPreference: g.genderPreference,
            ageRange: g.ageRange,
            heightRequirements: g.heightRequirements,
          },
          crew: g.crewDetails ?? {},
        },
        p4: {
          ancillaryProvided: g.ancillaryLogistics?.provided ?? [],
          mediaRequirements: {
            headshots: g.mediaRequirements?.headshots ?? false,
            fullBody: g.mediaRequirements?.fullBody ?? false,
            videoReel: g.mediaRequirements?.videoReel ?? false,
            audioSample: g.mediaRequirements?.audioSample ?? false,
            notes: g.mediaRequirements?.notes ?? '',
          },
          applicationDeadline: g.applicationDeadline
            ? dayjs(g.applicationDeadline).format('YYYY-MM-DD')
            : '',
          maxApplicants: g.maxApplications?.toString() ?? '',
          description: g.description ?? '',
          perks: g.compensation?.perks ?? [],
          termsAndConditions: g.termsAndConditions ?? '',
        },
        isUrgent: g.isUrgent ?? false,
        isFeatured: g.isFeatured ?? false,
      });
    }, [existing, gigId]);

    const handleBack = useCallback((): boolean => {
      if (isNavigatingAway.current) return false;
      if (page > 1) {
        setPage(page - 1);
        return true;
      }
      setLeaveVisible(true);
      return true;
    }, [page]);

    React.useImperativeHandle(ref, () => ({ handleBack }));

    const doSubmit = async (isDraft: boolean) => {
      const payload = {
        ...buildBackendPayload(state),
        status: (isDraft ? 'draft' : 'published') as any,
      };
      try {
        if (gigId) {
          // Wave 6: `as any` removed — `types/gig.ts` was widened to
          // include per-track / per-shoot comp models and the Plan 4
          // backend sub-documents (musicDetails, modelDetails, etc.).
          await updateMutation.mutateAsync({ id: gigId, payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        isNavigatingAway.current = true;
        onPublish(payload);
      } catch (err: any) {
        console.error('GigFormV2 submit error', err);
      }
    };

    // Page-5 preview shows what an ARTIST will see when they open the gig
    // (per spec Open Q #4). To get artist-side rendering — and hide the
    // organizer-only "Applications" tab — we deliberately mismatch the
    // organizerId from the current user so `useGigActions` resolves
    // `isOrganizer = false`. organizerSnapshot is hydrated from the
    // current user since they ARE the organizer (real backend will set
    // organizerId = req.user.id at create time).
    const currentUser = useAuthStore((s) => s.user);
    const previewGig = useMemo(() => {
      const base = buildBackendPayload(state);
      return {
        ...base,
        _id: 'preview-gig',
        // Sentinel id that will never match `user._id` — keeps preview
        // in artist-side mode regardless of who's logged in.
        organizerId: { _id: '__preview_artist_view__' },
        organizerSnapshot: {
          displayName: (currentUser as any)?.displayName ?? '',
          organizationName: (currentUser as any)?.organizationName ?? '',
          profileImageUrl: (currentUser as any)?.profileImageUrl ?? '',
          rating: (currentUser as any)?.cached?.averageRating ?? 0,
        },
        viewerContext: { hasApplied: false, isOrganizer: false },
      };
    }, [state, currentUser]);
    // Checks need a richer input than the backend payload: they read
    // `compensation.structure` (UI-only; not sent to server) plus `title` +
    // `description` which live at different nesting levels in state. Merge
    // the payload with the structure flag so every check can see what it
    // needs. Post-code-review P1-1 + P1-3 fix.
    const formStateForChecks = useMemo(
      () => ({
        ...previewGig,
        title: state.p1.title,
        description: state.p4.description,
        compensation: {
          ...previewGig.compensation,
          structure: state.p2.compensationStructure,
        },
      }),
      [previewGig, state.p1.title, state.p4.description, state.p2.compensationStructure]
    );

    return (
      <View style={styles.root}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(page / TOTAL_PAGES) * 100}%` }]} />
        </View>

        {/* Step dots */}
        <View style={styles.dotsRow}>
          {PAGE_LABELS.map((lbl, idx) => {
            const isCurrent = page === idx + 1;
            const isDone = page > idx + 1;
            return (
              <TouchableOpacity
                key={lbl}
                onPress={() => setPage(idx + 1)}
                style={styles.dotContainer}
                accessibilityRole="button"
                accessibilityLabel={`Go to step ${idx + 1}: ${lbl}`}
              >
                <View style={[styles.dot, isCurrent && styles.dotCurrent, isDone && styles.dotDone]} />
                <Text style={[styles.dotLabel, isCurrent && styles.dotLabelCurrent]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {page === 1 && (
            <Page1Identity
              value={state.p1}
              onChange={(v) => setState({ ...state, p1: v })}
            />
          )}
          {page === 2 && (
            <Page2Commitment
              artistTypes={state.p1.artistTypes}
              value={state.p2}
              onChange={(v) => setState({ ...state, p2: v })}
            />
          )}
          {page === 3 && (
            <Page3Fit
              artistTypes={state.p1.artistTypes}
              value={state.p3}
              onChange={(v) => setState({ ...state, p3: v })}
              sliderWidth={sliderWidth}
              eventFunction={state.p1.eventFunction}
            />
          )}
          {page === 4 && (
            <Page4Logistics
              value={state.p4}
              onChange={(v) => setState({ ...state, p4: v })}
            />
          )}
          {page === 5 && (
            <Page5SafetyReview
              formState={formStateForChecks as any}
              previewGig={previewGig}
              isLoading={isLoading}
              onDraft={() => doSubmit(true)}
              onPublish={() => doSubmit(false)}
            />
          )}
        </ScrollView>

        {/* Footer navigation (only on pages 1-4; Page 5 has its own Draft/Publish) */}
        {page < 5 && (
          <View style={styles.footer}>
            {page > 1 && (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ChevronLeft size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setPage(page + 1)}
              style={styles.nextBtn}
              accessibilityRole="button"
              accessibilityLabel="Next"
            >
              <Text style={styles.nextLabel}>Next</Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <LeaveGigModal
          visible={leaveVisible}
          onDismiss={() => setLeaveVisible(false)}
          onSaveDraft={() => doSubmit(true)}
          onDiscard={() => {
            isNavigatingAway.current = true;
            onCancel();
          }}
          isSaving={isLoading}
        />
      </View>
    );
  }
);

GigFormV2.displayName = 'GigFormV2';
export default GigFormV2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  progressBar: { height: 3, backgroundColor: '#18181C' },
  progressFill: { height: '100%', backgroundColor: '#FF6B35' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0A0E',
  },
  dotContainer: { alignItems: 'center', gap: 4, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#27272A' },
  dotCurrent: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  dotDone: { backgroundColor: 'rgba(255, 107, 53, 0.35)' },
  dotLabel: { fontSize: 9, color: '#52525B', textTransform: 'uppercase', letterSpacing: 0.5 },
  dotLabelCurrent: { color: '#FFFFFF', fontWeight: '900' as any },
  // Bigger paddingBottom on the scroll content so the last fields aren't
  // sandwiched between the footer (above) and the bottom-nav (below). Enough
  // room to scroll past both with breathing room.
  content: { padding: 20, paddingBottom: 200 },
  footer: {
    position: 'absolute',
    // Sits ABOVE the floating BottomNav (height 64 + paddingBottom 20 iOS /
    // 12 Android = 84 / 76px from screen bottom). +8 for visual gap.
    bottom: Platform.OS === 'ios' ? 92 : 84,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: 'rgba(10, 10, 14, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
  },
  nextLabel: {
    fontFamily: 'Outfit-Black',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
