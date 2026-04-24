// netsa-mobile/src/components/create/blocks/CrewBlock.tsx
//
// Conditional block for Group D performers (Photographer, Videographer,
// Makeup Artist, Stylist). Simplest of the four performer-context blocks:
// no chip rows, no sub-blocks — just deliverables (what will they hand
// back?), style references (moodboard / Pinterest URLs), and an
// equipment-provided bool.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Wrench, Check } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TextArea } from '@/components/ui/TextArea';
import { TagInput } from '@/components/ui/TagInput';

export interface CrewBlockProps {
  value: {
    deliverables?: string;
    styleReferences?: string[];
    equipmentProvided?: boolean;
  };
  onChange: (next: CrewBlockProps['value']) => void;
}

export default function CrewBlock({ value, onChange }: CrewBlockProps) {
  const update = (patch: Partial<CrewBlockProps['value']>) => onChange({ ...value, ...patch });

  return (
    <View style={styles.card} accessibilityLabel="Creative crew details">
      <View style={styles.headerRow}>
        <Wrench size={16} color="#FBBF24" />
        <Text style={styles.headerLabel}>For the crew</Text>
      </View>

      <InputGroup label="Deliverables" subtitle="What will they hand back?">
        <TextArea
          rows={3}
          value={value.deliverables ?? ''}
          onChangeText={(v: string) => update({ deliverables: v })}
          placeholder="e.g. 50 edited photos, 3-min highlight video, Makeup for 5 people"
        />
      </InputGroup>

      <InputGroup label="Style references" subtitle="Moodboard / Pinterest / URL links">
        <TagInput
          value={(value.styleReferences ?? []).join(', ')}
          onChangeTags={(v: string) => update({ styleReferences: v.split(',').map((s) => s.trim()).filter(Boolean) })}
          placeholder="https://pinterest.com/moody-weddings"
        />
      </InputGroup>

      <TouchableOpacity
        onPress={() => update({ equipmentProvided: !value.equipmentProvided })}
        style={styles.checkbox}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!value.equipmentProvided }}
      >
        <View style={[styles.checkboxBox, value.equipmentProvided && styles.checkboxBoxActive]}>
          {value.equipmentProvided && <Check size={14} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>Equipment provided by hirer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0F0F12', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1F1F23', marginVertical: 8, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: 0.5 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#52525B', alignItems: 'center', justifyContent: 'center' },
  checkboxBoxActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  checkboxLabel: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#D4D4D8' },
});
