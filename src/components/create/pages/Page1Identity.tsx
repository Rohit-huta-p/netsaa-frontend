// netsa-mobile/src/components/create/pages/Page1Identity.tsx
//
// Page 1 of the GigForm v2 flow ("The gig"). Occasion (text input +
// tap-to-fill suggestion chips), performer-type multi-select (cap 3),
// headcount quick-pick tiles, and the auto-generated title (editable).
//
// Auto-title lives in the orchestrator (GigFormV2.buildAutoTitle + an
// effect); this page reports a *manual* title edit via `onManualTitleEdit`
// so the effect stops overwriting the user's text.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Sparkles, Calendar, Users } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import StyledTextInput from '@/components/ui/StyledTextInput';
import ChipPicker from '@/components/ui/ChipPicker';
import { PERFORMER_TYPES } from '@/constants/performerGroups';

export interface Page1Value {
  title: string;
  artistTypes: string[];
  eventFunction: string;
  /** v2 — how many performers the gig needs. */
  headcount?: number;
}

export interface Page1IdentityProps {
  value: Page1Value;
  onChange: (next: Page1Value) => void;
  onAiExtract?: () => void; // Plan 6 — optional paragraph→pre-fill
  /** Called the first time the user edits the title by hand, so the
   *  orchestrator's auto-title effect stops overwriting it. */
  onManualTitleEdit?: () => void;
}

const MAX_TYPES = 3;

// Common occasions surfaced as tap-to-fill chips. Includes the
// ROLE_TYPE_RELEVANT_FUNCTIONS set (Film shoot, Audition, …) so common
// casting cases produce exact `eventFunction` values the Step-3 "Role type"
// conditional can match.
const OCCASION_SUGGESTIONS = [
  'Wedding',
  'Sangeet',
  'Corporate gala',
  'Film shoot',
  'Audition',
  'Photo shoot',
  'Birthday',
  'Live concert',
];

const QUICK_COUNTS = [1, 2, 3, 4, 5];

export default function Page1Identity({
  value,
  onChange,
  onAiExtract,
  onManualTitleEdit,
}: Page1IdentityProps) {
  const update = (patch: Partial<Page1Value>) => onChange({ ...value, ...patch });

  const handleArtistTypesChange = (next: string | string[]) => {
    const nextList = Array.isArray(next) ? next : [];
    const cur = value.artistTypes ?? [];
    if (nextList.length > cur.length && cur.length >= MAX_TYPES) {
      Alert.alert(
        'Maximum 3 performer types',
        'Posting for 4+ different types? Consider splitting into separate gigs for better matches.'
      );
      return;
    }
    update({ artistTypes: nextList });
  };

  const headcount = value.headcount;
  const isCustomCount = headcount != null && headcount > 5;
  const unit = value.artistTypes?.[0] ? `${value.artistTypes[0].toLowerCase()}s` : 'performers';

  return (
    <View style={styles.container}>
      {onAiExtract && (
        <TouchableOpacity onPress={onAiExtract} style={styles.aiButton}>
          <Sparkles size={14} color="#FF6B35" />
          <Text style={styles.aiLabel}>Paste a description and I'll fill what I can</Text>
        </TouchableOpacity>
      )}

      {/* Occasion — text input + tap-to-fill suggestions */}
      <InputGroup label="Occasion / event" subtitle="What's the gig for?" required>
        <StyledTextInput
          icon={Calendar}
          value={value.eventFunction}
          onChangeText={(v: string) => update({ eventFunction: v })}
          placeholder="e.g. Sangeet, Corporate gala, Audition"
        />
        <View style={styles.suggestRow}>
          {OCCASION_SUGGESTIONS.map((occ) => (
            <TouchableOpacity
              key={occ}
              onPress={() => update({ eventFunction: occ })}
              style={styles.suggestChip}
              accessibilityRole="button"
              accessibilityLabel={`Use occasion ${occ}`}
            >
              <Text style={styles.suggestChipText}>{occ}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </InputGroup>

      {/* Performer type */}
      <InputGroup label="Performer type" subtitle={`Multi-select, up to ${MAX_TYPES}`} required>
        <ChipPicker
          mode="multi"
          max={MAX_TYPES}
          options={PERFORMER_TYPES}
          value={value.artistTypes ?? []}
          onChange={handleArtistTypesChange}
          accessibilityLabel="Performer types"
        />
      </InputGroup>

      {/* Headcount — quick-pick tiles, "6+" reveals a numeric field */}
      <InputGroup label={`How many ${unit}?`} required>
        <View style={styles.tilesRow}>
          {QUICK_COUNTS.map((n) => {
            const active = headcount === n;
            return (
              <TouchableOpacity
                key={n}
                onPress={() => update({ headcount: n })}
                style={[styles.tile, active && styles.tileActive]}
                accessibilityRole="button"
                accessibilityLabel={`${n} ${unit}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tileText, active && styles.tileTextActive]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => update({ headcount: isCustomCount ? headcount : 6 })}
            style={[styles.tile, styles.tileWide, isCustomCount && styles.tileActive]}
            accessibilityRole="button"
            accessibilityLabel="Six or more"
            accessibilityState={{ selected: isCustomCount }}
          >
            <Text style={[styles.tileText, styles.tileTextWide, isCustomCount && styles.tileTextActive]}>
              6+
            </Text>
          </TouchableOpacity>
        </View>
        {isCustomCount && (
          <View style={styles.customCount}>
            <StyledTextInput
              icon={Users}
              inputMode="numeric"
              value={String(headcount)}
              onChangeText={(v: string) => {
                const n = parseInt(v, 10);
                update({ headcount: Number.isFinite(n) && n > 0 ? n : undefined });
              }}
              placeholder="e.g. 12"
            />
          </View>
        )}
      </InputGroup>

      {/* Title — auto-filled by the orchestrator, editable */}
      <InputGroup label="Title" subtitle="Auto-written from the above — tap to edit">
        <StyledTextInput
          value={value.title}
          onChangeText={(v: string) => {
            onManualTitleEdit?.();
            update({ title: v });
          }}
          placeholder="e.g. 5 dancers for sangeet performance"
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
  tilesRow: { flexDirection: 'row', gap: 7 },
  tile: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#101016',
    borderWidth: 1,
    borderColor: '#262630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileWide: { flex: 1.3 },
  tileActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  tileText: { fontFamily: 'Outfit-Bold', fontSize: 16, color: '#D0D0D9' },
  tileTextWide: { fontSize: 14 },
  tileTextActive: { color: '#FFFFFF' },
  customCount: { marginTop: 10 },
});
