// netsa-mobile/src/components/create/blocks/VisualBlock.tsx
//
// Conditional block for Group B performers (Dancer, Actor, Emcee, Performing
// Artist). Core fields (role type, required skills, experience level) are
// always visible. "Physical fit filters" (gender preference, age range, body
// type) live behind an expand toggle — collapsed by default — with nudge
// copy pushing hirers toward inclusive defaults. Per Wave 3 eng-review, the
// chip rows use the shared ChipPicker primitive; the MultiSlider stays
// inline because it's a slider, not a chip.

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

export interface VisualBlockProps {
  value: {
    roleType?: RoleType;
    bodyType?: BodyType;
    requiredSkills?: string[];
    experienceLevel?: ExperienceLevel;
    genderPreference?: GenderPreference;
    ageRange?: { min: number; max: number };
    heightRequirements?: {
      male?: { min: string; max: string };
      female?: { min: string; max: string };
    };
  };
  onChange: (next: VisualBlockProps['value']) => void;
  sliderWidth: number; // passed from parent for MultiSlider length
}

export default function VisualBlock({ value, onChange, sliderWidth }: VisualBlockProps) {
  const [showPhysical, setShowPhysical] = useState(false);
  const update = (patch: Partial<VisualBlockProps['value']>) => onChange({ ...value, ...patch });

  const ageMin = value.ageRange?.min ?? 18;
  const ageMax = value.ageRange?.max ?? 60;

  return (
    <View style={styles.card} accessibilityLabel="Visual performer details">
      <View style={styles.headerRow}>
        <Users size={16} color="#22D3EE" />
        <Text style={styles.headerLabel}>For the performer</Text>
      </View>

      <InputGroup label="Role type">
        <ChipPicker
          mode="single"
          options={ROLE_TYPES}
          value={value.roleType ?? ''}
          onChange={(next) => update({ roleType: (next as string) as RoleType })}
        />
      </InputGroup>

      <InputGroup label="Required skills" subtitle="Type comma or enter to add">
        <TagInput
          value={(value.requiredSkills ?? []).join(', ')}
          onChangeTags={(v: string) => update({ requiredSkills: v.split(',').map((s) => s.trim()).filter(Boolean) })}
          placeholder="e.g. Classical dance, Improv, Stage combat"
        />
      </InputGroup>

      <InputGroup label="Experience level">
        <ChipPicker
          mode="single"
          options={EXPERIENCE_LEVELS}
          value={value.experienceLevel ?? ''}
          onChange={(next) => update({ experienceLevel: (next as string) as ExperienceLevel })}
        />
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
              onChange={(next) => update({ genderPreference: (next as string) as GenderPreference })}
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

          <InputGroup label="Body type (optional)">
            <ChipPicker
              mode="single"
              options={BODY_TYPES}
              value={value.bodyType ?? ''}
              onChange={(next) => update({ bodyType: (next as string) as BodyType })}
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
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  expandLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#D4D4D8' },
  nudgeText: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#71717A', marginTop: -8, marginLeft: 22, lineHeight: 16 },
  physicalBlock: { backgroundColor: '#18181C', borderRadius: 12, padding: 14, gap: 12, borderLeftWidth: 3, borderLeftColor: '#22D3EE' },
});
