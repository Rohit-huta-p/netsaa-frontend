/**
 * hubTokens — the A·Minimal palette + font names for the Manage-Event host hub
 * (DOCS/04-design/mockups/manage-event-aminimal.html). Values are copied 1:1 from
 * the shipped siblings in this folder — RequestCard.tsx / RequestsList.tsx — so the
 * hub, its attendee rows and its sheets read as one surface with the Requests tab.
 *
 * This is the #121216 canvas, NOT the older #0B0A0F `eventTokens` (@/constants/
 * themeColors) nor the warm #060509 Living-Poster palette the hub replaces.
 *
 * Greys run cream → t1 → t2 → t3 (brightest to mutest):
 *   t1 #C9C6CF  = RequestCard `text2`
 *   t2 #9C99A6  = RequestCard `text3` / RequestsList `text3`
 *   t3 #6E6C76  = RequestCard `text4` / RequestsList `text4`
 */
export const C = {
  // surfaces
  bg: '#121216',           // canvas
  card: '#1C1C23',         // a row/card lifting off the canvas
  well: '#212129',         // an inset well inside a card
  chip: '#24242E',         // segmented chip
  sheet: '#17171D',        // bottom-sheet surface
  hairline: 'rgba(255,255,255,0.08)',
  hairSoft: 'rgba(255,255,255,0.06)',

  // text
  cream: '#F3EFE8',
  t1: '#C9C6CF',
  t2: '#9C99A6',
  t3: '#6E6C76',

  // orange (primary)
  orange: '#FF6B35',
  orangeTint: '#FFCBB2',
  orangeSoft: 'rgba(255,107,53,0.14)',
  orangeLine: 'rgba(255,107,53,0.30)',
  ink: '#160A04',          // ink on an orange / cream fill

  // accents (match the shipped siblings' coral/mint/gold)
  gold: '#F0B65A',
  coral: '#F0858A',        // destructive / "red"
  coralSoft: 'rgba(240,101,107,0.12)',
  coralLine: 'rgba(240,101,107,0.30)',
  mint: '#6EE7A0',         // success / checked-in "green"
  mintSoft: 'rgba(34,197,94,0.12)',
  mintLine: 'rgba(34,197,94,0.32)',
  blue: '#3B82F6',
  purple: '#8B5CF6',

  // misc
  slotOff: '#2A2A35',      // unlit capacity-bar cell
} as const;

/** Loaded font family names (expo-font), same as every shipped A·Minimal sibling. */
export const F = {
  serif: 'DMSerifDisplay_400Regular',
  body: 'Outfit-Regular',
  medium: 'Outfit-Medium',
  semibold: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
  mono: 'SpaceMono-Regular',
  monoBold: 'SpaceMono-Bold',
} as const;
