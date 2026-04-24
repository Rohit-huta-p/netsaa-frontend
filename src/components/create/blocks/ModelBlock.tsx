// netsa-mobile/src/components/create/blocks/ModelBlock.tsx
//
// Conditional block for Group C performers (Model). Surfaces two REQUIRED
// fields — shoot type + nudity level — plus optional wardrobe notes, usage
// rights, release bool, and measurements. Shoot type + usage rights use the
// shared ChipPicker primitive per Wave 3 eng-review guidance. Nudity level
// stays as a custom radio list because each option carries per-option legal
// copy (NUDITY_LEVEL_COPY) rendered beneath the label — that's not standard
// chip UX.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, Check } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TextArea } from '@/components/ui/TextArea';
import StyledTextInput from '@/components/ui/StyledTextInput';
import ChipPicker from '@/components/ui/ChipPicker';
import { SHOOT_TYPES, type ShootType } from '@/constants/shootTypes';
import { NUDITY_LEVELS, NUDITY_LEVEL_COPY, type NudityLevel } from '@/constants/nudityLevels';
import { USAGE_RIGHTS } from '@/constants/usageRights';

export interface ModelBlockProps {
  value: {
    shootType?: ShootType;
    nudityLevel?: NudityLevel;
    wardrobeNotes?: string;
    usageRights?: string[];
    releaseRequired?: boolean;
    measurements?: {
      height?: string;
      bust?: string;
      waist?: string;
      hips?: string;
      hair?: string;
      eyes?: string;
    };
  };
  onChange: (next: ModelBlockProps['value']) => void;
}

export default function ModelBlock({ value, onChange }: ModelBlockProps) {
  const update = (patch: Partial<ModelBlockProps['value']>) => onChange({ ...value, ...patch });
  const updateMeasurements = (patch: Partial<NonNullable<ModelBlockProps['value']['measurements']>>) =>
    onChange({ ...value, measurements: { ...(value.measurements ?? {}), ...patch } });

  return (
    <View style={styles.card} accessibilityLabel="Model performer details">
      <View style={styles.headerRow}>
        <Camera size={16} color="#F472B6" />
        <Text style={styles.headerLabel}>For the model</Text>
      </View>

      <InputGroup label="Shoot type *" subtitle="Required for model gigs">
        <ChipPicker
          mode="single"
          options={[...SHOOT_TYPES]}
          value={value.shootType ?? ''}
          onChange={(next) => update({ shootType: (next as string) as ShootType })}
        />
      </InputGroup>

      <InputGroup label="Nudity level *" subtitle="Required. Select None if not applicable.">
        <View style={{ gap: 8 }}>
          {NUDITY_LEVELS.map((lvl) => {
            const active = value.nudityLevel === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                onPress={() => update({ nudityLevel: lvl })}
                style={[styles.radioRow, active && styles.radioRowActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.radioDot, active && styles.radioDotActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.radioLabel, active && styles.radioLabelActive]}>{lvl}</Text>
                  <Text style={styles.radioSub}>{NUDITY_LEVEL_COPY[lvl]}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </InputGroup>

      <InputGroup label="Wardrobe notes">
        <TextArea
          rows={3}
          value={value.wardrobeNotes ?? ''}
          onChangeText={(v: string) => update({ wardrobeNotes: v })}
          placeholder="e.g. Formal evening wear, model brings own shoes..."
        />
      </InputGroup>

      <InputGroup label="Usage rights" subtitle="Tap to toggle — multi-select">
        <ChipPicker
          mode="multi"
          options={[...USAGE_RIGHTS]}
          value={value.usageRights ?? []}
          onChange={(next) => update({ usageRights: next as string[] })}
        />
      </InputGroup>

      <TouchableOpacity
        onPress={() => update({ releaseRequired: !value.releaseRequired })}
        style={styles.checkbox}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!value.releaseRequired }}
      >
        <View style={[styles.checkboxBox, value.releaseRequired && styles.checkboxBoxActive]}>
          {value.releaseRequired && <Check size={14} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>Model release required</Text>
      </TouchableOpacity>

      <View style={styles.measureBlock}>
        <Text style={styles.measureLabel}>Measurements (optional)</Text>
        <View style={styles.row3}>
          <View style={{ flex: 1 }}>
            <StyledTextInput
              value={value.measurements?.height}
              onChangeText={(v: string) => updateMeasurements({ height: v })}
              placeholder="Height"
            />
          </View>
          <View style={{ flex: 1 }}>
            <StyledTextInput
              value={value.measurements?.hair}
              onChangeText={(v: string) => updateMeasurements({ hair: v })}
              placeholder="Hair"
            />
          </View>
          <View style={{ flex: 1 }}>
            <StyledTextInput
              value={value.measurements?.eyes}
              onChangeText={(v: string) => updateMeasurements({ eyes: v })}
              placeholder="Eyes"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0F0F12', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1F1F23', marginVertical: 8, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F472B6', textTransform: 'uppercase', letterSpacing: 0.5 },
  radioRow: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1F1F23' },
  radioRowActive: { borderColor: '#FF6B35', backgroundColor: 'rgba(255, 107, 53, 0.08)' },
  radioDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#52525B', marginTop: 2 },
  radioDotActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B35' },
  radioLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#E5E5E5' },
  radioLabelActive: { color: '#FF6B35' },
  radioSub: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#71717A', marginTop: 2, lineHeight: 16 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#52525B', alignItems: 'center', justifyContent: 'center' },
  checkboxBoxActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  checkboxLabel: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#D4D4D8' },
  measureBlock: { backgroundColor: '#18181C', borderRadius: 12, padding: 14, gap: 10, borderLeftWidth: 3, borderLeftColor: '#F472B6' },
  measureLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 0.5 },
  row3: { flexDirection: 'row', gap: 8 },
});
