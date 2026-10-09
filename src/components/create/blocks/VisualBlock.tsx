// netsa-mobile/src/components/create/blocks/VisualBlock.tsx
//
// Conditional block for Group B performers (Dancer, Actor, Emcee, Performing
// Artist). Core fields (role type, required skills, experience level) are
// always visible. "Physical fit filters" (gender preference, age range, body
// type) live behind an expand toggle — collapsed by default — with nudge
// copy pushing hirers toward inclusive defaults. Per Wave 3 eng-review, the
// chip rows use the shared ChipPicker primitive; the MultiSlider stays
// inline because it's a slider, not a chip.
//
// v2: required skills gain tap-to-add suggestion chips (added skills render as
// TagInput pills, same size as the performer-type chips). Minimum experience
// is now a chip row (No min / 1+ / 2+ / 3+ / 5+ / 10+) instead of a numeric
// field, so it no longer eats a full row.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronRight, Users } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TagInput } from '@/components/ui/TagInput';
import ChipPicker from '@/components/ui/ChipPicker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

type RoleType = 'lead' | 'supporting' | 'extra' | 'background';
type BodyType = 'slim' | 'athletic' | 'average' | 'plus' | 'any';
type ExperienceLevel = 'beginner' | 'intermediate' | 'professional';
type GenderPreference = 'any' | 'male' | 'female' | 'other';

const ROLE_TYPES: RoleType[] = ['lead', 'supporting', 'extra', 'background'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'professional'];
const GENDER_OPTIONS: GenderPreference[] = ['any', 'male', 'female', 'other'];
const BODY_TYPES: BodyType[] = ['slim', 'athletic', 'average', 'plus', 'any'];

// Minimum-experience presets. `null` = "No min" (clears the field). Rendered
// as a compact chip row — no longer a full-width numeric input.
const MIN_EXP_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'No min', value: null },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '5+', value: 5 },
  { label: '10+', value: 10 },
];

// Tap-to-add skill suggestions. Tapping appends to requiredSkills (deduped);
// the chip then disappears from the suggestion row.
const SKILL_SUGGESTIONS = [
  'Classical dance',
  'Contemporary',
  'Hip-hop',
  'Improv',
  'Stage combat',
  'Partner work',
  'Vocals',
  'Freestyle',
];

// Role type is a film/casting concept (lead/supporting/extra/background).
// Wedding/corporate hirers don't think this way. Reveal only when the gig
// context is film, photo, audition, or fashion — where role hierarchy
// drives compensation + casting expectations.
const ROLE_TYPE_RELEVANT_FUNCTIONS = new Set([
  'Film shoot',
  'TV shoot',
  'Audition',
  'Photo shoot',
  'Fashion show',
  'Music recording',
  'Live concert',
]);

export interface VisualBlockProps {
  value: {
    roleType?: RoleType;
    bodyType?: BodyType[]; // multi-select per UX feedback (slim OR athletic OK)
    requiredSkills?: string[];
    experienceLevel?: ExperienceLevel;
    minExperienceYears?: number;
    genderPreference?: GenderPreference;
    ageRange?: { min: number; max: number };
    heightRequirements?: {
      male?: { min: string; max: string };
      female?: { min: string; max: string };
    };
  };
  onChange: (next: VisualBlockProps['value']) => void;
  sliderWidth: number; // passed from parent for MultiSlider length
  /** Optional gig context. Drives roleType visibility — see ROLE_TYPE_RELEVANT_FUNCTIONS. */
  eventFunction?: string;
}

export default function VisualBlock({ value, onChange, sliderWidth, eventFunction }: VisualBlockProps) {
  const [showPhysical, setShowPhysical] = useState(false);
  const update = (patch: Partial<VisualBlockProps['value']>) => onChange({ ...value, ...patch });

  const ageMin = value.ageRange?.min ?? 18;
  const ageMax = value.ageRange?.max ?? 60;

  const showRoleType = !!eventFunction && ROLE_TYPE_RELEVANT_FUNCTIONS.has(eventFunction);

  const skills = value.requiredSkills ?? [];
  const addSkill = (skill: string) => {
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    update({ requiredSkills: [...skills, skill] });
  };
  const openSuggestions = SKILL_SUGGESTIONS.filter(
    (s) => !skills.some((cur) => cur.toLowerCase() === s.toLowerCase())
  );

  return (
    <View style={styles.card} accessibilityLabel="Visual performer details">
      <View style={styles.headerRow}>
        <Users size={16} color="#22D3EE" />
        <Text style={styles.headerLabel}>For the performer</Text>
      </View>

      {showRoleType && (
        <InputGroup label="Role type" subtitle="Casting hierarchy for film / shoot / audition">
          <ChipPicker
            mode="single"
            options={ROLE_TYPES}
            value={value.roleType ?? ''}
            onChange={(next) => {
              const v = next as string;
              update({ roleType: v ? (v as RoleType) : undefined });
            }}
          />
        </InputGroup>
      )}

      <InputGroup label="Required skills" subtitle="Type and press enter, or tap a suggestion">
        <TagInput
          value={skills.join(', ')}
          onChangeTags={(v: string) =>
            update({ requiredSkills: v.split(',').map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="e.g. Classical dance, Improv, Stage combat"
        />
        {openSuggestions.length > 0 && (
          <View style={styles.suggestRow}>
            {openSuggestions.map((skill) => (
              <TouchableOpacity
                key={skill}
                onPress={() => addSkill(skill)}
                style={styles.suggestChip}
                accessibilityRole="button"
                accessibilityLabel={`Add skill ${skill}`}
              >
                <Text style={styles.suggestChipText}>+ {skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </InputGroup>

      <InputGroup label="Experience level">
        <ChipPicker
          mode="single"
          options={EXPERIENCE_LEVELS}
          value={value.experienceLevel ?? ''}
          onChange={(next) => {
            const v = next as string;
            update({ experienceLevel: v ? (v as ExperienceLevel) : undefined });
          }}
        />
      </InputGroup>

      {/* Minimum years — compact chip row (was a full-width numeric field) */}
      <InputGroup label="Minimum experience" subtitle="Shows on the gig as e.g. “5+ years” (optional)">
        <View style={styles.expRow}>
          {MIN_EXP_OPTIONS.map((opt) => {
            const active =
              opt.value === null
                ? value.minExperienceYears == null
                : value.minExperienceYears === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => update({ minExperienceYears: opt.value ?? undefined })}
                style={[styles.expChip, active && styles.expChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Minimum experience ${opt.label}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.expChipText, active && styles.expChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </InputGroup>

      <TouchableOpacity
        onPress={() => setShowPhysical((v) => !v)}
        style={styles.expandRow}
        accessibilityRole="button"
        accessibilityLabel={showPhysical ? 'Collapse physical fit filters' : 'Expand physical fit filters'}
      >
        {showPhysical ? <ChevronDown size={16} color="#A1A1AA" /> : <ChevronRight size={16} color="#A1A1AA" />}
        <Text style={styles.expandLabel}>Physical fit filters (optional)</Text>
      </TouchableOpacity>
      {!showPhysical && (
        <Text style={styles.nudgeText}>
          Most hirers skip this. Narrowing filters reduces applicant pool significantly.
        </Text>
      )}

      {showPhysical && (
        <View style={styles.physicalBlock}>
          <InputGroup label="Gender preference">
            <ChipPicker
              mode="single"
              options={GENDER_OPTIONS}
              value={value.genderPreference ?? ''}
              onChange={(next) => {
                const v = next as string;
                update({ genderPreference: v ? (v as GenderPreference) : undefined });
              }}
            />
          </InputGroup>

          <InputGroup label={`Age range: ${ageMin}-${ageMax} years`}>
            <MultiSlider
              values={[ageMin, ageMax]}
              sliderLength={sliderWidth}
              min={5}
              max={100}
              step={1}
              allowOverlap={false}
              snapped
              onValuesChange={(vals) => update({ ageRange: { min: vals[0], max: vals[1] } })}
              selectedStyle={{ backgroundColor: '#FF6B35' }}
              unselectedStyle={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              markerStyle={{ backgroundColor: '#FF6B35', width: 13, height: 13, borderWidth: 0, marginTop: 4 }}
            />
          </InputGroup>

          <InputGroup label="Body type (optional)" subtitle="Multi-select — open to multiple types">
            <ChipPicker
              mode="multi"
              options={BODY_TYPES}
              value={value.bodyType ?? []}
              onChange={(next) => update({ bodyType: (next as string[]) as BodyType[] })}
            />
          </InputGroup>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0F0F12', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1F1F23', marginVertical: 8, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#22D3EE', textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  suggestChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#3A3A47',
    borderStyle: 'dashed',
  },
  suggestChipText: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#AEAEBA' },
  expRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  expChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#101016',
    borderWidth: 1,
    borderColor: '#262630',
  },
  expChipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  expChipText: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#D0D0D9' },
  expChipTextActive: { color: '#FFFFFF' },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  expandLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#D4D4D8' },
  nudgeText: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#71717A', marginTop: -8, marginLeft: 22, lineHeight: 16 },
  physicalBlock: { backgroundColor: '#18181C', borderRadius: 12, padding: 14, gap: 12, borderLeftWidth: 3, borderLeftColor: '#22D3EE' },
});
