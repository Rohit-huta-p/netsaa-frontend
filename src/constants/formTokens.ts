// netsa-frontend/src/constants/formTokens.ts
//
// Shared design tokens for the multi-step creation forms (Gig create-flow v2
// and the Event composer). Single source of truth so the two forms can't
// drift apart — import these instead of hardcoding hex values.
//
//   import { SURFACE, BORDER, ACCENT, TEXT, FONT, RADIUS, STATUS } from '@/constants/formTokens';
//
// The system is a LAYERED near-black dark theme: each surface sits a shade
// lighter than the one behind it (canvas → header → card → well → chip), with
// a single warm accent (orange #FF6B35). Values are the audited gig-form set;
// keep them identical across both forms.

/** Layered surfaces, darkest (furthest back) to lightest (most lifted). */
export const SURFACE = {
  canvas: '#000',                       // form background (root)
  header: '#0A0A0E',                    // step-header strip; also the artist-preview frame
  footer: 'rgba(5, 5, 7, 0.96)',        // pinned bottom action bar
  card: '#0F0F12',                      // block / section cards
  cardAlt: '#0B0B0F',                   // grouped field card (e.g. the Location card)
  cardElevated: '#0F0F16',              // slightly lifted card variant
  sheet: '#0F0F14',                     // bottom sheets + dropdown menus
  well: '#101016',                      // input wells, quick-pick tiles
  segTrack: '#0C0C11',                  // segmented-control track
  wellTranslucent: 'rgba(24, 24, 27, 0.5)', // text-input wells (over the canvas)
  pill: '#1C1C25',                      // inline pills (e.g. the unit pill)
  chip: '#17171C',                      // elevated chips: back chip, "Next" button
  inset: '#18181C',                     // recessed fill: progress track, nested sub-block
  neutral: '#27272A',                   // neutral button (e.g. Save draft)
} as const;

/** Borders, dividers and hairlines. */
export const BORDER = {
  default: '#262630',                   // wells, tiles, grouped cards, segmented track
  card: '#1F1F23',                      // block / section cards
  pill: '#34343F',                      // inline pills
  dashed: '#3A3A47',                    // dashed "tap to add" suggestion chips
  muted: '#2A2A33',                     // "Next" button border, idle mini-dot
  hairline: 'rgba(255, 255, 255, 0.055)', // dividers inside grouped cards
  separator: 'rgba(255, 255, 255, 0.06)', // strip top/bottom separators (footer)
  separatorFaint: 'rgba(255, 255, 255, 0.05)',
  well: 'rgba(255, 255, 255, 0.1)',     // outline on translucent input wells
} as const;

/** The single warm accent and its tints. Orange is the ONLY accent — avoid
 *  introducing a second hue (the gig form's cyan was block-category-specific
 *  and should not be inherited by other forms). */
export const ACCENT = {
  primary: '#FF6B35',                   // active state, progress fill, required *, arrows, primary CTA
  amber: '#FF8C42',                     // gradient partner / hover warmth
  tint14: 'rgba(255, 107, 53, 0.14)',   // accent-chip fill (e.g. the arrow chip)
  tint10: 'rgba(255, 107, 53, 0.10)',   // soft accent fill (reveal buttons)
  tint08: 'rgba(255, 107, 53, 0.08)',   // faint accent fill (AI/helper buttons)
  tint07: 'rgba(255, 107, 53, 0.07)',   // accent info card (e.g. estimated total)
  border30: 'rgba(255, 107, 53, 0.30)',
  border32: 'rgba(255, 107, 53, 0.32)',
  border40: 'rgba(255, 107, 53, 0.40)',
  done: 'rgba(255, 107, 53, 0.4)',      // completed step dot
} as const;

/** Text roles. VALUES ARE NEVER BOLD — the field title (`label`) carries the
 *  weight; the value underneath stays regular/medium. */
export const TEXT = {
  value: '#FFFFFF',                     // primary input value
  label: '#F0F0F2',                     // field title (Outfit-SemiBold 15)
  helper: '#7A7A86',                    // helper / subtitle under a label (11.5)
  meta: '#6A6A76',                      // mono step counter ("STEP 1 OF 6")
  secondary: '#A1A1AA',                 // section labels, secondary copy
  key: '#8B8B99',                       // compact field keys (grouped card)
  chip: '#D0D0D9',                      // filled chip text
  chipMuted: '#AEAEBA',                 // dashed-chip / inactive-segment text
  icon: '#D4D4D8',                      // header chevrons / neutral icons
  placeholder: '#54545C',               // input placeholder
  dim: '#71717A',                       // nudge copy
  disabled: '#52525B',                  // disabled text / control
  onAccent: '#FFFFFF',                  // text/icon on an orange fill
} as const;

/** Font families (loaded app-wide via expo-font). */
export const FONT = {
  serif: 'DMSerifDisplay_400Regular',   // step titles / editorial headlines
  mono: 'SpaceMono-Regular',            // metadata labels ("STEP 1 OF 6")
  regular: 'Outfit-Regular',
  medium: 'Outfit-Medium',
  semibold: 'Outfit-SemiBold',          // field titles
  bold: 'Outfit-Bold',
  black: 'Outfit-Black',                // all-caps micro-labels / primary CTA
} as const;

/** Corner radii. */
export const RADIUS = {
  card: 16,
  cardTight: 13,                        // grouped field card
  well: 12,                             // wells, tiles, buttons
  chip: 10,
  chipSm: 9,
  pill: 9,
  control: 10,                          // back chip, small square controls
  nextAct: 14,                          // "Next" button
  sheet: 24,                            // bottom-sheet top corners
} as const;

/** Validation / guardrail severities (for a form's review step). */
export const STATUS = {
  error: '#F43F5E',
  success: '#22C55E',
  hard: '#EF4444',
  hardBg: '#3F1212',
  soft: '#F59E0B',                      // also the "gold" verified tier
  softBg: '#3A2A0E',
  trust: '#A78BFA',
  trustBg: '#2A1E3F',
} as const;

const FORM_TOKENS = { SURFACE, BORDER, ACCENT, TEXT, FONT, RADIUS, STATUS } as const;
export default FORM_TOKENS;
