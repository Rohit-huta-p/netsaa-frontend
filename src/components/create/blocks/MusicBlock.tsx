// netsa-mobile/src/components/create/blocks/MusicBlock.tsx
//
// Conditional block for Group A performers (Singer, Musician, Band, DJ,
// Music Producer). Shows common music fields + sub-blocks based on the
// specific types selected.
//
// Per Plan 5 Wave 3 eng note: chip rows for `deliverableFormats` (multi)
// and `attirePreference` (single) use the shared ChipPicker primitive
// instead of inline TouchableOpacity rows. The equipment-provided checkbox
// remains inline — it's a bool toggle, not a chip picker.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Music } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TagInput } from '@/components/ui/TagInput';
import StyledTextInput from '@/components/ui/StyledTextInput';
import ChipPicker from '@/components/ui/ChipPicker';
import { MUSIC_GENRES } from '@/constants/musicGenres';

export interface MusicBlockProps {
  artistTypes: string[];
  value: {
    genres?: string[];
    equipmentProvided?: boolean;
    bpm?: string;
    musicalKey?: string;
    deliverableFormats?: string[];
    referenceTracks?: string[];
    turnaroundDays?: string;
    revisionsIncluded?: string;
    setLengthHours?: string;
    bandSize?: string;
    attirePreference?: 'formal' | 'casual' | 'themed' | 'open';
  };
  onChange: (next: MusicBlockProps['value']) => void;
}

const DELIVERABLE_PRESETS = ['Stems', 'Mixed Stereo', 'Mastered WAV', 'MP3'];
const ATTIRE_OPTIONS = ['formal', 'casual', 'themed', 'open'] as const;

export default function MusicBlock({ artistTypes, value, onChange }: MusicBlockProps) {
  const update = (patch: Partial<MusicBlockProps['value']>) =>
    onChange({ ...value, ...patch });

  const isProducer = artistTypes.includes('Music Producer');
  const isDJ = artistTypes.includes('DJ');
  const isBand = artistTypes.includes('Band');

  return (
    <View style={styles.card} accessibilityLabel="Music performer details">
      <View style={styles.headerRow}>
        <Music size={16} color="#A78BFA" />
        <Text style={styles.headerLabel}>For the musician</Text>
      </View>

      <InputGroup label="Genre" subtitle="Tap suggestions or type custom">
        {/*
          Plan called for a `suggestions` prop on TagInput but the current
          TagInput primitive (Wave 1 scope) doesn't expose one. MUSIC_GENRES
          kept imported so Wave 4 pages can surface suggestions via a
          separate ChipPicker if needed. Preserved import to keep plan intent.
        */}
        <TagInput
          value={(value.genres ?? []).join(', ')}
          onChangeTags={(v: string) => update({ genres: v.split(',').map((s) => s.trim()).filter(Boolean) })}
          placeholder="e.g. Bollywood, Sufi, Jazz"
        />
      </InputGroup>

      <TouchableOpacity
        onPress={() => update({ equipmentProvided: !value.equipmentProvided })}
        style={[styles.checkbox, value.equipmentProvided && styles.checkboxActive]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!value.equipmentProvided }}
      >
        <View style={[styles.checkboxBox, value.equipmentProvided && styles.checkboxBoxActive]}>
          {value.equipmentProvided && <Check size={14} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>Equipment provided by hirer</Text>
      </TouchableOpacity>

      {isProducer && (
        <View style={styles.subBlock}>
          <Text style={styles.subBlockLabel}>Producer details</Text>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <InputGroup label="BPM (optional)">
                <StyledTextInput
                  value={value.bpm}
                  onChangeText={(v: string) => update({ bpm: v })}
                  placeholder="128"
                  inputMode="numeric"
                />
              </InputGroup>
            </View>
            <View style={{ flex: 1 }}>
              <InputGroup label="Key (optional)">
                <StyledTextInput
                  value={value.musicalKey}
                  onChangeText={(v: string) => update({ musicalKey: v })}
                  placeholder="Cmaj"
                />
              </InputGroup>
            </View>
          </View>
          <InputGroup label="Deliverable formats" subtitle="Tap to toggle">
            <ChipPicker
              mode="multi"
              options={DELIVERABLE_PRESETS}
              value={value.deliverableFormats ?? []}
              onChange={(next) => update({ deliverableFormats: next as string[] })}
            />
          </InputGroup>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <InputGroup label="Turnaround (days)*">
                <StyledTextInput
                  value={value.turnaroundDays}
                  onChangeText={(v: string) => update({ turnaroundDays: v })}
                  placeholder="14"
                  inputMode="numeric"
                />
              </InputGroup>
            </View>
            <View style={{ flex: 1 }}>
              <InputGroup label="Revisions included">
                <StyledTextInput
                  value={value.revisionsIncluded ?? '2'}
                  onChangeText={(v: string) => update({ revisionsIncluded: v })}
                  placeholder="2"
                  inputMode="numeric"
                />
              </InputGroup>
            </View>
          </View>
        </View>
      )}

      {isDJ && (
        <View style={styles.subBlock}>
          <Text style={styles.subBlockLabel}>DJ details</Text>
          <InputGroup label="Set length (hours)">
            <StyledTextInput
              value={value.setLengthHours}
              onChangeText={(v: string) => update({ setLengthHours: v })}
              placeholder="3"
              inputMode="numeric"
            />
          </InputGroup>
        </View>
      )}

      {isBand && (
        <View style={styles.subBlock}>
          <Text style={styles.subBlockLabel}>Band details</Text>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <InputGroup label="Band size">
                <StyledTextInput
                  value={value.bandSize}
                  onChangeText={(v: string) => update({ bandSize: v })}
                  placeholder="4"
                  inputMode="numeric"
                />
              </InputGroup>
            </View>
            <View style={{ flex: 1 }}>
              <InputGroup label="Attire">
                <ChipPicker
                  mode="single"
                  options={[...ATTIRE_OPTIONS]}
                  value={value.attirePreference ?? ''}
                  onChange={(next) =>
                    update({ attirePreference: (next as string) as MusicBlockProps['value']['attirePreference'] })
                  }
                />
              </InputGroup>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0F0F12', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1F1F23', marginVertical: 8, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 0.5 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkboxActive: {},
  checkboxBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#52525B', alignItems: 'center', justifyContent: 'center' },
  checkboxBoxActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  checkboxLabel: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#D4D4D8' },
  subBlock: { backgroundColor: '#18181C', borderRadius: 12, padding: 14, gap: 12, borderLeftWidth: 3, borderLeftColor: '#A78BFA' },
  subBlockLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 0.5 },
  row2: { flexDirection: 'row', gap: 10 },
});
