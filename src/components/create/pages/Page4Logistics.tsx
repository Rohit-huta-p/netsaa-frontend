// netsa-mobile/src/components/create/pages/Page4Logistics.tsx
//
// Page 5 of the GigForm v2 flow ("Describe & terms"). Reordered so the gig's
// story reads top-down: Description → Perks → What you'll do → deadline → T&C.
// Description and T&C each keep an AI-rephrase button wired to
// gigService.rephraseText (mirrors the legacy GigForm pattern byte-for-byte).
//
// v2 removals: submission-media toggles, notes-for-applicants, and
// max-applicants are gone (they tested as friction, not signal). "What you'll
// do" is now a free textarea (newline-separated) instead of a tag input.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Wand2 } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { TextArea } from '@/components/ui/TextArea';
import gigService from '@/services/gigService';
import dayjs from 'dayjs';
import { TermsTemplates } from './components/TermsTemplates';
// CONTRACTS-DISABLED: Phase 4A custom contract clauses hidden until the
// contract artifact is restored. Import retained below for fast revert.
// import { CustomClausesEditor } from '@/features/booking-terms-editor/components/CustomClausesEditor';

export interface Page4Value {
  applicationDeadline?: string;
  description: string;
  responsibilities?: string[];
  perks?: string[];
  termsAndConditions: string;
  /** Phase 4A — custom contract clauses (1-5, ≤500 chars each). */
  customClauses?: string[];
}

export interface Page4LogisticsProps {
  value: Page4Value;
  onChange: (next: Page4Value) => void;
}

export default function Page4Logistics({ value, onChange }: Page4LogisticsProps) {
  const update = (patch: Partial<Page4Value>) => onChange({ ...value, ...patch });
  const [rephrasingField, setRephrasingField] = useState<'description' | 'termsAndConditions' | null>(
    null
  );

  const handleRephrase = async (field: 'description' | 'termsAndConditions') => {
    const text = value[field] ?? '';
    if (!text || text.length < 5) {
      Alert.alert('Input required', 'Please enter some text to rephrase.');
      return;
    }
    setRephrasingField(field);
    try {
      const result = await gigService.rephraseText(text);
      if (result?.rephrased) {
        update({ [field]: result.rephrased } as Partial<Page4Value>);
      }
    } catch (err: any) {
      console.error('Rephrase failed:', err);
      Alert.alert('Error', 'Failed to rephrase text. Please try again.');
    } finally {
      setRephrasingField(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Description with AI rephrase */}
      <InputGroup label="Description" subtitle="What's this gig about?" required>
        <View style={styles.aiButtonRow}>
          <TouchableOpacity
            onPress={() => handleRephrase('description')}
            disabled={!!rephrasingField}
            style={styles.aiButton}
            accessibilityLabel="Rephrase description with AI"
          >
            {rephrasingField === 'description' ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <Wand2 size={12} color="#FF6B35" />
            )}
            <Text style={styles.aiButtonLabel}>
              {rephrasingField === 'description' ? 'AI Magic...' : 'Rephrase with AI'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextArea
          rows={5}
          value={value.description}
          onChangeText={(v: string) => update({ description: v })}
          placeholder="Describe the gig, what you're looking for, and any context artists should know."
        />
      </InputGroup>

      {/* Perks — moved above "What you'll do" per v2 ordering */}
      <InputGroup label="Perks" subtitle="What else do performers get? (optional)">
        <TagInput
          value={(value.perks ?? []).join(', ')}
          onChangeTags={(v: string) =>
            update({
              perks: v
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="e.g. meals, travel, wardrobe"
        />
      </InputGroup>

      {/* What you'll do — free textarea (newline-separated), was a tag input */}
      <InputGroup label="What you'll do" subtitle="Key responsibilities, one per line (optional)">
        <TextArea
          rows={4}
          value={(value.responsibilities ?? []).join('\n')}
          onChangeText={(v: string) =>
            update({
              responsibilities: v
                .split('\n')
                .map((s) => s.trimStart())
                .filter((s, i, arr) => s.length > 0 || i < arr.length - 1),
            })
          }
          placeholder={'Lead a 3-song set\n2 rehearsals\nCoordinate sub-artists'}
        />
      </InputGroup>

      <InputGroup label="Application deadline" subtitle="Last day to apply (optional)">
        <DatePickerInput
          label=""
          value={value.applicationDeadline ?? ''}
          onChange={(d: Date) => update({ applicationDeadline: dayjs(d).format('YYYY-MM-DD') })}
          placeholder="Select date"
          minimumDate={new Date()}
        />
      </InputGroup>

      {/* T&C with template chip row + AI rephrase */}
      <InputGroup
        label="Terms & conditions"
        subtitle="Pick a starting template or write your own — artists must agree before applying"
      >
        <TermsTemplates
          currentValue={value.termsAndConditions}
          onSelect={(body) => update({ termsAndConditions: body })}
        />
        <View style={styles.aiButtonRow}>
          <TouchableOpacity
            onPress={() => handleRephrase('termsAndConditions')}
            disabled={!!rephrasingField}
            style={styles.aiButton}
            accessibilityLabel="Rephrase terms with AI"
          >
            {rephrasingField === 'termsAndConditions' ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <Wand2 size={12} color="#FF6B35" />
            )}
            <Text style={styles.aiButtonLabel}>
              {rephrasingField === 'termsAndConditions' ? 'AI Magic...' : 'Rephrase with AI'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextArea
          rows={6}
          value={value.termsAndConditions}
          onChangeText={(v: string) => update({ termsAndConditions: v })}
          placeholder="Payment terms, cancellation policy, expectations..."
        />
      </InputGroup>

      {/* CONTRACTS-DISABLED: Phase 4A custom clauses hidden until the
          contract artifact is restored. Block retained below for fast revert. */}
      {/*
      <InputGroup
        label="Custom contract clauses (optional)"
        subtitle="Up to 5 — show on every contract artists sign for this gig">
        <CustomClausesEditor
          clauses={value.customClauses ?? []}
          onChange={(next) => update({ customClauses: next })}
        />
      </InputGroup>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  aiButtonRow: { alignItems: 'flex-end', marginBottom: 6 },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.5)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiButtonLabel: {
    fontFamily: 'Outfit-Black',
    fontSize: 10,
    color: '#FF6B35',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
