/**
 * Event-type presets — v4 "one form for every event".
 *
 * The type NEVER changes the form and carries NO rules. A preset only seeds
 * suggestions and defaults the host can change: the people role, the starting
 * spot(s), the add-spot affordance, the default door policy, which optional
 * Describe sections open, and the suggested sign-up questions. (Spec Appendix A.)
 */

export type EventTypeKey =
  | 'workshop' | 'masterclass' | 'audition' | 'open_mic'
  | 'competition' | 'performance' | 'screening' | 'meetup' | 'other';

export type DoorPolicy = 'open' | 'guest_list' | 'apply';
export type DescribeSection = 'lineup' | 'included';

export interface StartingSpot {
  name: string;
  note?: string;
  /** suggested-free by default (host can still charge; no type rules, Q5) */
  free?: boolean;
}

export interface EventTypePreset {
  key: EventTypeKey;
  label: string;
  peopleRole: string;
  startingSpots: StartingSpot[];
  addSpotLabel: string;
  addSpotPills: string[];
  defaultDoor: DoorPolicy;
  openSections: DescribeSection[];
  questionSuggestions: string[];
}

const P = (p: EventTypePreset) => p;

export const EVENT_TYPE_PRESETS: Record<EventTypeKey, EventTypePreset> = {
  workshop: P({
    key: 'workshop', label: 'Workshop', peopleRole: 'Teacher',
    startingSpots: [{ name: 'Seats' }],
    addSpotLabel: 'Add another kind of spot', addSpotPills: ['Observer', 'Student', 'Pair'],
    defaultDoor: 'open', openSections: ['lineup', 'included'],
    questionSuggestions: ['Email', 'Instagram'],
  }),
  masterclass: P({
    key: 'masterclass', label: 'Masterclass', peopleRole: 'Teacher',
    startingSpots: [{ name: 'Seats' }],
    addSpotLabel: 'Add another kind of spot', addSpotPills: ['Watch only', 'Student'],
    defaultDoor: 'open', openSections: ['lineup', 'included'],
    questionSuggestions: ['Email', 'SoundCloud link'],
  }),
  audition: P({
    key: 'audition', label: 'Audition', peopleRole: 'Casting director',
    startingSpots: [{ name: 'Role 1', free: true }],
    addSpotLabel: 'Add a role', addSpotPills: [],
    defaultDoor: 'apply', openSections: ['lineup', 'included'],
    questionSuggestions: ['Email', 'Languages you speak'],
  }),
  open_mic: P({
    key: 'open_mic', label: 'Open mic / Jam', peopleRole: 'Host',
    startingSpots: [{ name: 'Perform', note: '7 min each', free: true }, { name: 'Watch' }],
    addSpotLabel: 'Add another kind of spot', addSpotPills: ['Feature act', 'Watch + dinner'],
    defaultDoor: 'open', openSections: ['lineup', 'included'],
    questionSuggestions: ['Email', 'Instagram'],
  }),
  competition: P({
    key: 'competition', label: 'Competition', peopleRole: 'Judge',
    startingSpots: [{ name: 'Entry' }],
    addSpotLabel: 'Add a category', addSpotPills: ['Covers', 'Under 21'],
    defaultDoor: 'apply', openSections: ['lineup', 'included'],
    questionSuggestions: ['Email', 'Instagram'],
  }),
  performance: P({
    key: 'performance', label: 'Performance', peopleRole: 'Performer',
    startingSpots: [{ name: 'Seats' }],
    addSpotLabel: 'Add another kind of spot', addSpotPills: [],
    defaultDoor: 'open', openSections: ['lineup'],
    questionSuggestions: ['Email'],
  }),
  screening: P({
    key: 'screening', label: 'Screening', peopleRole: 'Filmmaker',
    startingSpots: [{ name: 'Seats' }],
    addSpotLabel: 'Add another kind of spot', addSpotPills: ['Student', 'Group of 4'],
    defaultDoor: 'open', openSections: ['lineup'],
    questionSuggestions: ['Email', 'What do you do in film?'],
  }),
  meetup: P({
    key: 'meetup', label: 'Meetup / Talk', peopleRole: 'Speaker',
    startingSpots: [{ name: 'Seats' }],
    addSpotLabel: 'Add another kind of spot', addSpotPills: ['Volunteer'],
    defaultDoor: 'open', openSections: ['lineup', 'included'],
    questionSuggestions: ['Email', 'Current project'],
  }),
  other: P({
    key: 'other', label: 'Event', peopleRole: 'Host',
    startingSpots: [{ name: 'Seats' }],
    addSpotLabel: 'Add another kind of spot', addSpotPills: [],
    defaultDoor: 'open', openSections: ['lineup'],
    questionSuggestions: ['Email'],
  }),
};

export const EVENT_TYPE_KEYS = Object.keys(EVENT_TYPE_PRESETS) as EventTypeKey[];

/** Preset for a type key; anything unknown (a typed-in type) falls back to `other`. */
export function presetFor(type?: string | null): EventTypePreset {
  if (type && (type in EVENT_TYPE_PRESETS)) return EVENT_TYPE_PRESETS[type as EventTypeKey];
  return EVENT_TYPE_PRESETS.other;
}
