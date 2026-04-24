// netsa-mobile/src/constants/shootTypes.ts
// Required enum for Model performer (spec §3 Group C).
export type ShootType = 'Editorial' | 'Commercial' | 'Fashion' | 'Fitness' | 'Lifestyle' | 'Art';

export const SHOOT_TYPES: readonly ShootType[] = [
  'Editorial',
  'Commercial',
  'Fashion',
  'Fitness',
  'Lifestyle',
  'Art',
] as const;
