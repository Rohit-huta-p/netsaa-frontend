// netsa-mobile/src/components/create/GigFormV2.tsx
//
// Orchestrator for the 6-step gig form (v2 redesign). Coexists with the
// legacy `GigForm.tsx` behind a feature flag; both expose the same
// `GigFormHandle` imperative ref (from `./GigFormTypes`) so the parent
// `create.tsx` route plumbs identically for either.
//
// Steps (v2): 1 The gig · 2 When & where · 3 Who fits · 4 Compensation ·
// 5 Describe & terms · 6 Review & publish. Compensation was split out of the
// old "When & where" step into its own step.
//
// Scope:
// - Holds all form state in one `useState<GigFormV2State>` (no Zustand —
//   ephemeral, no cross-screen reuse).
// - Renders the 6 steps with forward/back navigation, a compact animated
//   step header (title + mini dots + progress), and per-step enter motion.
// - Auto-writes the title from occasion + headcount + performer type + city
//   until the user edits it by hand (then it stops overwriting).
// - Submits via `useCreateGig().mutateAsync` (create) or
//   `useUpdateGig().mutateAsync` (edit when `gigId` prop is set).
//
// Exports `setByPath`, `buildBackendPayload`, and `buildAutoTitle` so they can
// be unit-tested without mounting the component.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import dayjs from 'dayjs';
import { useCreateGig, useUpdateGig, useGig } from '@/hooks/useGigs';
import useAuthStore from '@/stores/authStore';
import Page1Identity, { type Page1Value } from './pages/Page1Identity';
import Page2Commitment, { type Page2Value } from './pages/Page2Commitment';
import Page3Fit, { type Page3Value } from './pages/Page3Fit';
import PageCompensation from './pages/PageCompensation';
import Page4Logistics, { type Page4Value } from './pages/Page4Logistics';
import Page5SafetyReview from './pages/Page5SafetyReview';
import { LeaveGigModal } from './LeaveGigModal';
import type { GigFormHandle } from './GigFormTypes';

const TOTAL_PAGES = 6;
// Short labels for the mini-dot rail.
const PAGE_LABELS = ['Gig', 'Where', 'Fit', 'Pay', 'Describe', 'Publish'];
// Full titles shown in the header + the "Next: …" footer hint.
const STEP_TITLES = [
  'The gig',
  'When & where',
  'Who fits',
  'Compensation',
  'Describe & terms',
  'Review & publish',
];

export interface GigFormV2State {
  p1: Page1Value;
  p2: Page2Value;
  p3: Page3Value;
  p4: Page4Value;
  isUrgent: boolean;
}

function initialState(): GigFormV2State {
  return {
    p1: { title: '', artistTypes: [], eventFunction: '' },
    p2: {
      startDate: '',
      city: '',
      state: 'Maharashtra',
      compensationModel: 'fixed',
      compensationStructure: 'fixed',
      negotiable: false,
      languagePreferences: [],
    },
    p3: { music: {}, model: {}, visual: {}, crew: {} },
    p4: {
      description: '',
      responsibilities: [],
      perks: [],
      termsAndConditions: '',
      // Phase 4A — custom contract clauses default empty. Cleaned + omitted
      // from the backend payload below when empty so we don't write `[]`.
      customClauses: [],
    },
    isUrgent: false,
  };
}

// ── Auto-title ──────────────────────────────────────────────────────
// "5 dancers for sangeet in Pune" — assembled from headcount + first
// performer type + occasion + city. Returns '' until there's at least one
// meaningful input, so the empty-title guardrail can still fire.
export function buildAutoTitle(p1: Page1Value, city?: string): string {
  const type = p1.artistTypes?.[0];
  const count = p1.headcount;
  const occ = p1.eventFunction?.trim();
  const where = city?.trim();
  if (!count && !type && !occ) return '';

  const typeLabel = type
    ? count && count > 1
      ? `${type.toLowerCase()}s`
      : type.toLowerCase()
    : 'performers';
  let title = count ? `${count} ${typeLabel}` : typeLabel;
  if (occ) title += ` for ${occ.toLowerCase()}`;
  if (where) title += ` in ${where}`;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// ── Nested state update helper ─────────────────────────────────────
// Writes `value` to the nested path `path` inside an immutable copy of
// `state`, preserving all unrelated sibling keys.
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
// Locks the shape Plan 4's Zod schema expects. Covered by
// `buildBackendPayload.test.ts`.

function coerceMusicNumeric(input: unknown): number | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;
  if (typeof input === 'string') {
    const n = parseFloat(input);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

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

  // Phase 4A — clean custom clauses: trim each, drop empties. Omit field
  // entirely when empty so backend keeps default (no clauses on this gig).
  const cleanedCustomClauses = (state.p4.customClauses ?? [])
    .map((c) => c.trim())
    .filter(Boolean);

  // "What you'll do" is a free textarea now (newline-separated); trim each
  // line and drop blanks before sending.
  const cleanedResponsibilities = (state.p4.responsibilities ?? [])
    .map((r) => r.trim())
    .filter(Boolean);

  return {
    title: state.p1.title,
    artistTypes: state.p1.artistTypes,
    eventFunction: state.p1.eventFunction,
    headcount: state.p1.headcount,
    description: state.p4.description,
    responsibilities: cleanedResponsibilities,
    type: 'one-time' as const,
    requiredSkills: state.p3.visual.requiredSkills ?? [],
    experienceLevel: state.p3.visual.experienceLevel ?? 'intermediate',
    minExperienceYears: state.p3.visual.minExperienceYears,
    genderPreference: state.p3.visual.genderPreference ?? 'any',
    ageRange: state.p3.visual.ageRange,
    heightRequirements: state.p3.visual.heightRequirements,
    location: {
      city: state.p2.city,
      venueName: state.p2.venue,
      address: state.p2.address,
      state: state.p2.state ?? 'Maharashtra',
      country: 'India',
      isRemote: false,
    },
    schedule: {
      startDate: new Date(state.p2.startDate),
      endDate: state.p2.endDate ? new Date(state.p2.endDate) : new Date(state.p2.startDate),
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
    termsAndConditions: state.p4.termsAndConditions,
    musicDetails: coerceMusicDetails(state.p3.music),
    modelDetails: state.p3.model,
    visualDetails: {
      roleType: state.p3.visual.roleType,
      bodyType: state.p3.visual.bodyType,
    },
    crewDetails: state.p3.crew,
    languagePreferences: state.p2.languagePreferences ?? [],
    ...(cleanedCustomClauses.length > 0 ? { customClauses: cleanedCustomClauses } : {}),
    isUrgent: state.isUrgent,
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
    // Flips true the first time the user hand-edits the title (or when we
    // populate from an existing gig) so the auto-title effect backs off.
    const titleTouched = useRef(false);

    // Motion — per-step enter (fade + rise) and animated progress fill.
    const scrollRef = useRef<ScrollView>(null);
    const enterAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(1 / TOTAL_PAGES)).current;

    const createMutation = useCreateGig();
    const updateMutation = useUpdateGig();
    const { data: existing } = useGig(gigId ?? '');
    const isLoading = createMutation.isPending || updateMutation.isPending;

    // Populate from existing on edit. Runs once when `existing` first
    // resolves for the current `gigId`. Mark the title touched so the
    // auto-title effect doesn't clobber the saved title.
    useEffect(() => {
      if (!existing || !gigId) return;
      const g: any = existing;
      titleTouched.current = true;
      setState({
        p1: {
          title: g.title ?? '',
          artistTypes: g.artistTypes ?? [],
          eventFunction: g.eventFunction ?? '',
          headcount: g.headcount,
        },
        p2: {
          startDate: g.schedule?.startDate ? dayjs(g.schedule.startDate).format('YYYY-MM-DD') : '',
          endDate: g.schedule?.endDate ? dayjs(g.schedule.endDate).format('YYYY-MM-DD') : '',
          city: g.location?.city ?? '',
          venue: g.location?.venueName ?? '',
          address: g.location?.address ?? '',
          state: g.location?.state ?? 'Maharashtra',
          compensationModel: g.compensation?.model ?? 'fixed',
          compensationStructure: g.compensation?.minAmount ? 'range' : 'fixed',
          amount: g.compensation?.amount?.toString() ?? '',
          minAmount: g.compensation?.minAmount?.toString() ?? '',
          maxAmount: g.compensation?.maxAmount?.toString() ?? '',
          negotiable: g.compensation?.negotiable ?? false,
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
            minExperienceYears: g.minExperienceYears,
            genderPreference: g.genderPreference,
            ageRange: g.ageRange,
            heightRequirements: g.heightRequirements,
          },
          crew: g.crewDetails ?? {},
        },
        p4: {
          applicationDeadline: g.applicationDeadline
            ? dayjs(g.applicationDeadline).format('YYYY-MM-DD')
            : '',
          description: g.description ?? '',
          responsibilities: g.responsibilities ?? [],
          perks: g.compensation?.perks ?? [],
          termsAndConditions: g.termsAndConditions ?? '',
          customClauses: g.customClauses ?? [],
        },
        isUrgent: g.isUrgent ?? false,
      });
    }, [existing, gigId]);

    // ── Auto-title effect ──
    // Recompute the title from p1 + city whenever those inputs change, until
    // the user takes over. The equality guard prevents an update loop.
    useEffect(() => {
      if (titleTouched.current) return;
      const auto = buildAutoTitle(state.p1, state.p2.city);
      if (auto !== state.p1.title) {
        setState((s) => ({ ...s, p1: { ...s.p1, title: auto } }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.p1.headcount, state.p1.artistTypes, state.p1.eventFunction, state.p2.city]);

    // ── Page-change motion ──
    useEffect(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      enterAnim.setValue(0);
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      Animated.timing(progressAnim, {
        toValue: page / TOTAL_PAGES,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

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
          await updateMutation.mutateAsync({ id: gigId, payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        isNavigatingAway.current = true;
        onPublish(payload);
      } catch (err: any) {
        console.error('GigFormV2 submit error', err);
        // Surface the failure — previously this was swallowed, so a rejected
        // post (e.g. backend validation) left the user on the review screen
        // with no feedback. Prefer the backend's message, fall back to axios/
        // generic copy.
        const data = err?.response?.data;
        const msg =
          data?.errors?.[0]?.message ||
          data?.message ||
          err?.message ||
          'Something went wrong. Please check your connection and try again.';
        Alert.alert(isDraft ? 'Could not save draft' : 'Could not publish gig', msg);
      }
    };

    // Page-6 preview shows what an ARTIST will see when they open the gig.
    // We deliberately mismatch the organizerId from the current user so
    // `useGigActions` resolves `isOrganizer = false` (artist-side rendering).
    const currentUser = useAuthStore((s) => s.user);
    const previewGig = useMemo(() => {
      const base = buildBackendPayload(state);
      return {
        ...base,
        _id: 'preview-gig',
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
    // `compensation.structure` (UI-only) plus `title` + `description` which
    // live at different nesting levels in state.
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
        {/* Compact step header — back · title · mini dots, with a thin
            animated progress fill beneath. */}
        <View style={styles.header}>
          <View style={styles.stepRow}>
            {/* Back is always in this row, next to the step title. On step 1 it
                exits the create flow (leave-confirm); on later steps it goes back
                a step. */}
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backChip}
              accessibilityRole="button"
              accessibilityLabel={page > 1 ? 'Back a step' : 'Exit'}
            >
              <ChevronLeft size={20} color="#D4D4D8" />
            </TouchableOpacity>
            <View style={styles.stepTitleWrap}>
              <Text style={styles.stepTitle} numberOfLines={1}>
                {STEP_TITLES[page - 1]}
              </Text>
              <Text style={styles.stepMeta}>Step {page} of {TOTAL_PAGES}</Text>
            </View>
            <View style={styles.miniDots}>
              {PAGE_LABELS.map((lbl, i) => (
                <TouchableOpacity
                  key={lbl}
                  onPress={() => setPage(i + 1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to step ${i + 1}: ${lbl}`}
                  hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
                >
                  <View
                    style={[
                      styles.miniDot,
                      page === i + 1 && styles.miniDotActive,
                      page > i + 1 && styles.miniDotDone,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: enterAnim,
              transform: [
                {
                  translateY: enterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            }}
          >
            {page === 1 && (
              <Page1Identity
                value={state.p1}
                onChange={(v) => setState({ ...state, p1: v })}
                onManualTitleEdit={() => {
                  titleTouched.current = true;
                }}
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
              <PageCompensation
                value={state.p2}
                onChange={(v) => setState({ ...state, p2: v })}
                artistTypes={state.p1.artistTypes}
                headcount={state.p1.headcount}
              />
            )}
            {page === 5 && (
              <Page4Logistics
                value={state.p4}
                onChange={(v) => setState({ ...state, p4: v })}
              />
            )}
            {page === 6 && (
              <Page5SafetyReview
                formState={formStateForChecks as any}
                previewGig={previewGig}
                isLoading={isLoading}
                onDraft={() => doSubmit(true)}
                onPublish={() => doSubmit(false)}
                onNavigateToPage={setPage}
                hirerName={
                  (currentUser as any)?.organizationName ||
                  (currentUser as any)?.displayName ||
                  undefined
                }
              />
            )}
          </Animated.View>
        </ScrollView>

        {/* Footer — content-hug "Next act" (neutral surface + orange arrow),
            pinned to the bottom. Page 6 has its own Draft/Publish. */}
        {page < TOTAL_PAGES && (
          <View style={styles.footer}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => setPage(page + 1)}
              style={styles.nextAct}
              accessibilityRole="button"
              accessibilityLabel={`Next: ${STEP_TITLES[page]}`}
            >
              <Text style={styles.nextActLabel}>Next: {STEP_TITLES[page]}</Text>
              <View style={styles.nextArrow}>
                <ChevronRight size={16} color="#FF6B35" />
              </View>
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

  // ── compact step header ──
  header: { backgroundColor: '#0A0A0E' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: '#262630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitleWrap: { flex: 1 },
  stepTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
  stepMeta: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    color: '#6A6A76',
    letterSpacing: 0.5,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  miniDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2A2A33' },
  miniDotActive: {
    width: 18,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  miniDotDone: { backgroundColor: 'rgba(255,107,53,0.4)' },
  progressTrack: { height: 2, backgroundColor: '#18181C' },
  progressFill: { height: '100%', backgroundColor: '#FF6B35' },

  content: { padding: 20, paddingBottom: 120 },

  // ── content-hug footer, pinned bottom ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(5, 5, 7, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  nextAct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingLeft: 18,
    paddingRight: 11,
    borderRadius: 14,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  nextActLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F0F0F2', letterSpacing: -0.2 },
  nextArrow: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,107,53,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
