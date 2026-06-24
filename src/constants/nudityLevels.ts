// netsa-mobile/src/constants/nudityLevels.ts
// Required enum for Model performer. Spec §3 Group C. Maps display
// label to legal/safety copy shown under the picker.

export type NudityLevel = 'None' | 'Implied' | 'Partial' | 'Artistic' | 'Nude';

export const NUDITY_LEVELS: readonly NudityLevel[] = [
  'None',
  'Implied',
  'Partial',
  'Artistic',
  'Nude',
] as const;

export const NUDITY_LEVEL_COPY: Record<NudityLevel, string> = {
  None: 'Fully clothed. No skin-revealing wardrobe beyond swimwear/lingerie.',
  Implied: 'Suggests nudity without showing it (strategic framing, sheets, etc.).',
  Partial: 'Exposed skin beyond swimwear but covering primary areas.',
  Artistic: 'Nudity in a fine-art context (editorial, tasteful, non-explicit).',
  Nude: 'Full nudity. Paid gigs only; underage talent forbidden by law.',
};
