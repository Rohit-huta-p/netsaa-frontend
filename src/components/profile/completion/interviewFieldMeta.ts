// netsa-frontend/src/components/profile/completion/interviewFieldMeta.ts
import type { SectionId } from '@/stores/profileUiStore';

export type PlaybillSlot = 'portrait' | 'name' | 'craft' | 'signature' | 'quote' | 'none';

export interface InterviewField {
  id: string;
  label: string;
  chipLabel: string;
  section: SectionId;
  question: string;
  inputType: 'text' | 'chips' | 'multiselect' | 'media' | 'verify';
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
  { test: /profile photo|portrait|avatar/i, build: (label) => ({ id: 'photo', label, chipLabel: 'Photo', section: 'media', question: 'Add a photo so hirers recognise you.', inputType: 'media', playbillSlot: 'portrait' }) },
  { test: /display name|^name/i, build: (label) => ({ id: 'displayName', label, chipLabel: 'Name', section: 'header', question: 'What should hirers call you?', inputType: 'text', playbillSlot: 'name' }) },
  { test: /artist type|art form/i, build: (label) => ({ id: 'artistType', label, chipLabel: 'Art form', section: 'identity', question: 'Which art form should hirers book you for?', inputType: 'chips', chips: ARTIST_TYPES, playbillSlot: 'craft' }) },
  { test: /skill/i, build: (label) => ({ id: 'skills', label, chipLabel: 'Skills', section: 'identity', question: 'Pick the styles you perform.', inputType: 'multiselect', chips: SKILL_OPTIONS, playbillSlot: 'none' }) },
  { test: /bio/i, build: (label) => ({ id: 'bio', label, chipLabel: 'Bio', section: 'about', question: 'In a line or two — who are you on stage?', inputType: 'text', playbillSlot: 'quote' }) },
  { test: /gallery|photos/i, build: (label) => ({ id: 'gallery', label, chipLabel: 'Gallery', section: 'media', question: 'Add a couple of photos of you performing.', inputType: 'media', playbillSlot: 'none' }) },
  { test: /video reel|reel|video/i, build: (label) => ({ id: 'videoReel', label, chipLabel: 'Video reel', section: 'media', question: 'Add one short performance clip.', inputType: 'media', playbillSlot: 'none' }) },
  { test: /experience|past performance/i, build: (label) => ({ id: 'experience', label, chipLabel: 'Past performance', section: 'about', question: "Add one past show you're proud of.", inputType: 'text', playbillSlot: 'signature' }) },
  { test: /location|city/i, build: (label) => ({ id: 'location', label, chipLabel: 'City', section: 'header', question: 'Which city are you based in?', inputType: 'text', playbillSlot: 'none' }) },
  // Account security, not profile content — never collected inline in the
  // Interview. ProfileInterviewSheet special-cases inputType 'verify' and
  // hands off to the edit-modal's 'verify' section instead.
  { test: /verified email|verify.*email|backup email/i, build: (label) => ({ id: 'email', label, chipLabel: 'Verify email', section: 'verify', question: 'Add a backup email so you never lose access to your account.', inputType: 'verify', playbillSlot: 'none' }) },
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
