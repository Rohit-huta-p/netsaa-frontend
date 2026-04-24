// netsa-mobile/src/components/create/pages/Page1Identity.tsx
//
// Page 1 of the GigForm v2 flow. Three fields: title, performer type
// multi-select (cap 3 with alert nudge), and event function via
// SearchableSelect with custom allowed.
//
// Uses the shared ChipPicker primitive (mode="multi", max=3) for the
// performer picker per Wave 4 brief. Per-tap alert kicks in when the
// user presses a 4th chip — we detect this by wrapping onChange and
// checking the requested length before forwarding.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Pencil, Sparkles } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import StyledTextInput from '@/components/ui/StyledTextInput';
import ChipPicker from '@/components/ui/ChipPicker';
import { PERFORMER_TYPES } from '@/constants/performerGroups';
import { EVENT_FUNCTION_PRESETS } from '@/constants/eventFunctions';

export interface Page1Value {
  title: string;
  artistTypes: string[];
  eventFunction: string;
}

export interface Page1IdentityProps {
  value: Page1Value;
  onChange: (next: Page1Value) => void;
  onAiExtract?: () => void; // Plan 6 — optional paragraph→pre-fill
}

const MAX_TYPES = 3;

export default function Page1Identity({ value, onChange, onAiExtract }: Page1IdentityProps) {
  const update = (patch: Partial<Page1Value>) => onChange({ ...value, ...patch });

  // Wrap ChipPicker's onChange so we can surface an alert when the user
  // is trying to add a 4th chip. ChipPicker silently ignores taps beyond
  // the cap, so we need to detect the attempt before forwarding.
  const handleArtistTypesChange = (next: string | string[]) => {
    const nextList = Array.isArray(next) ? next : [];
    const cur = value.artistTypes ?? [];
    // Addition at cap → surface alert and drop the change
    if (nextList.length > cur.length && cur.length >= MAX_TYPES) {
      Alert.alert(
        'Maximum 3 performer types',
        'Posting for 4+ different types? Consider splitting into separate gigs for better matches.'
      );
      return;
    }
    update({ artistTypes: nextList });
  };

  return (
    <View style={styles.container}>
      {onAiExtract && (
        <TouchableOpacity onPress={onAiExtract} style={styles.aiButton}>
          <Sparkles size={14} color="#FF6B35" />
          <Text style={styles.aiLabel}>Paste a description and I'll fill what I can</Text>
        </TouchableOpacity>
      )}

      <InputGroup label="Gig title" subtitle="Make it clear and specific">
        <StyledTextInput
          icon={Pencil}
          value={value.title}
          onChangeText={(v: string) => update({ title: v })}
          placeholder="e.g. 5 dancers for sangeet performance"
        />
      </InputGroup>

      <InputGroup label="Performer type" subtitle={`Multi-select, up to ${MAX_TYPES}`}>
        <ChipPicker
          mode="multi"
          max={MAX_TYPES}
          options={PERFORMER_TYPES}
          value={value.artistTypes ?? []}
          onChange={handleArtistTypesChange}
          accessibilityLabel="Performer types"
        />
      </InputGroup>

      <InputGroup label="Event function" subtitle="Tap a suggestion or type custom">
        <SearchableSelect
          options={EVENT_FUNCTION_PRESETS.map((p) => ({ label: p, value: p }))}
          value={value.eventFunction}
          onChange={(v) => update({ eventFunction: v })}
          placeholder="Search or type..."
          allowCustom={true}
          label="Select event function"
        />
      </InputGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  aiLabel: { fontFamily: 'Outfit-Medium', fontSize: 13, color: '#FF6B35' },
});
