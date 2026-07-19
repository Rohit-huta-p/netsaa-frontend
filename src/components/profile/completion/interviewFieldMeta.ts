// netsa-frontend/src/components/profile/completion/interviewFieldMeta.ts
import type { SectionId } from '@/stores/profileUiStore';

export type PlaybillSlot = 'portrait' | 'name' | 'craft' | 'signature' | 'quote' | 'none';

export interface InterviewField {
  id: string;
  label: string;
  section: SectionId;
  question: string;
  inputType: 'text' | 'chips' | 'multiselect' | 'media';
  chips?: string[];
  playbillSlot: PlaybillSlot;
}

// Kept in sync with SkillsBottomSheet's local lists (single source lives here).
export const ARTIST_TYPES = ['Actor', 'Dancer', 'Singer', 'Model', 'DJ', 'Musician'];
export const SKILL_OPTIONS = [
  'Contemporary', 'Kathak', 'Hip Hop', 'Jazz', 'Classical',
  'Folk', 'Ballet', 'Salsa', 'Storytelling', 'Choreography',
  'Beatboxing', 'Freestyle', 'Improv', 'Voice Acting', 'Emceeing',
];

type Rule = { test: RegExp; build: (label: string) => InterviewField };

const RULES: Rule[] = [
  { test: /profile photo|portrait|avatar/i, build: (label) => ({ id: 'photo', label, section: 'media', question: 'Add a photo so hirers recognise you.', inputType: 'media', playbillSlot: 'portrait' }) },
  { test: /display name|^name/i, build: (label) => ({ id: 'displayName', label, section: 'header', question: 'What should hirers call you?', inputType: 'text', playbillSlot: 'name' }) },
  { test: /artist type|art form/i, build: (label) => ({ id: 'artistType', label, section: 'identity', question: 'Which art form should hirers book you for?', inputType: 'chips', chips: ARTIST_TYPES, playbillSlot: 'craft' }) },
  { test: /skill/i, build: (label) => ({ id: 'skills', label, section: 'identity', question: 'Pick the styles you perform.', inputType: 'multiselect', chips: SKILL_OPTIONS, playbillSlot: 'none' }) },
  { test: /bio/i, build: (label) => ({ id: 'bio', label, section: 'about', question: 'In a line or two — who are you on stage?', inputType: 'text', playbillSlot: 'quote' }) },
  { test: /gallery|photos/i, build: (label) => ({ id: 'gallery', label, section: 'media', question: 'Add a couple of photos of you performing.', inputType: 'media', playbillSlot: 'none' }) },
  { test: /video reel|reel|video/i, build: (label) => ({ id: 'videoReel', label, section: 'media', question: 'Add one short performance clip.', inputType: 'media', playbillSlot: 'none' }) },
  { test: /experience|past performance/i, build: (label) => ({ id: 'experience', label, section: 'about', question: "Add one past show you're proud of.", inputType: 'text', playbillSlot: 'signature' }) },
  { test: /location|city/i, build: (label) => ({ id: 'location', label, section: 'header', question: 'Which city are you based in?', inputType: 'text', playbillSlot: 'none' }) },
];

// Order matters: 'photo' before 'gallery/photos', 'video reel' before 'video'.
export function enrichMissing(labels: string[]): InterviewField[] {
  const out: InterviewField[] = [];
  const seen = new Set<string>();
  for (const label of labels) {
    const rule = RULES.find((r) => r.test.test(label));
    if (!rule) continue; // never invent a field
    const field = rule.build(label);
    if (seen.has(field.id)) continue;
    seen.add(field.id);
    out.push(field);
  }
  return out;
}
