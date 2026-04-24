// netsa-mobile/src/components/create/pages/Page3Fit.tsx
//
// Dispatcher for conditional blocks. Given artistTypes, resolves the
// groups and renders Music / Visual / Model / Crew / Other blocks in
// that order. Each block owns its portion of the form state.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { resolveGroups } from '@/constants/performerGroups';
import MusicBlock, { type MusicBlockProps } from '../blocks/MusicBlock';
import ModelBlock, { type ModelBlockProps } from '../blocks/ModelBlock';
import VisualBlock, { type VisualBlockProps } from '../blocks/VisualBlock';
import CrewBlock, { type CrewBlockProps } from '../blocks/CrewBlock';
import { InputGroup } from '@/components/ui/InputGroup';
import { TextArea } from '@/components/ui/TextArea';

export interface Page3Value {
  music: MusicBlockProps['value'];
  model: ModelBlockProps['value'];
  visual: VisualBlockProps['value'];
  crew: CrewBlockProps['value'];
  customNotes?: string;
}

export interface Page3FitProps {
  artistTypes: string[];
  value: Page3Value;
  onChange: (next: Page3Value) => void;
  sliderWidth: number;
}

export default function Page3Fit({ artistTypes, value, onChange, sliderWidth }: Page3FitProps) {
  const groups = resolveGroups(artistTypes);

  if (groups.size === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Select performer type on Page 1 to configure fit details.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groups.has('A') && (
        <MusicBlock
          artistTypes={artistTypes}
          value={value.music}
          onChange={(v) => onChange({ ...value, music: v })}
        />
      )}
      {groups.has('B') && (
        <VisualBlock
          value={value.visual}
          onChange={(v) => onChange({ ...value, visual: v })}
          sliderWidth={sliderWidth}
        />
      )}
      {groups.has('C') && (
        <ModelBlock
          value={value.model}
          onChange={(v) => onChange({ ...value, model: v })}
        />
      )}
      {groups.has('D') && (
        <CrewBlock
          value={value.crew}
          onChange={(v) => onChange({ ...value, crew: v })}
        />
      )}
      {groups.has('E') && (
        <View style={styles.card}>
          <InputGroup label="Custom notes" subtitle="Non-standard gig — describe what's needed">
            <TextArea
              rows={4}
              value={value.customNotes ?? ''}
              onChangeText={(v: string) => onChange({ ...value, customNotes: v })}
              placeholder="What are you looking for?"
            />
          </InputGroup>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  empty: { padding: 20, backgroundColor: '#18181C', borderRadius: 12, alignItems: 'center' },
  emptyText: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#71717A', textAlign: 'center' },
  card: {
    backgroundColor: '#0F0F12',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F1F23',
    marginVertical: 8,
  },
});
