// netsa-mobile/src/components/create/pages/Page4Logistics.tsx
//
// Page 4 of the GigForm v2 flow. Ancillary chips, 4 submission-media
// toggles (via ChipPicker multi), a note field, deadline, max applicants,
// description + perks + T&C (description and T&C each have an AI-rephrase
// button wired to gigService.rephraseText).
//
// The AI-rephrase handler mirrors the legacy GigForm pattern byte-for-byte
// so the UX stays identical across the migration window.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Wand2, Users, Calendar } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { TextArea } from '@/components/ui/TextArea';
import StyledTextInput from '@/components/ui/StyledTextInput';
import ChipPicker from '@/components/ui/ChipPicker';
import { ANCILLARY_PRESETS } from '@/constants/ancillaryPresets';
import gigService from '@/services/gigService';
import dayjs from 'dayjs';

export interface Page4Value {
  ancillaryProvided?: string[];
  mediaRequirements: {
    headshots: boolean;
    fullBody: boolean;
    videoReel: boolean;
    audioSample: boolean;
    notes: string;
  };
  applicationDeadline?: string;
  maxApplicants?: string;
  description: string;
  perks?: string[];
  termsAndConditions: string;
}

export interface Page4LogisticsProps {
  value: Page4Value;
  onChange: (next: Page4Value) => void;
}

const SUBMISSION_OPTIONS = [
  { label: 'Headshots', value: 'headshots' },
  { label: 'Full body', value: 'fullBody' },
  { label: 'Video reel', value: 'videoReel' },
  { label: 'Audio sample', value: 'audioSample' },
] as const;

type SubmissionKey = 'headshots' | 'fullBody' | 'videoReel' | 'audioSample';

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

  // Convert boolean flags ↔ string[] so ChipPicker can drive submission toggles.
  const selectedSubmissions = (Object.keys(value.mediaRequirements) as (keyof Page4Value['mediaRequirements'])[])
    .filter((k): k is SubmissionKey => k !== 'notes' && value.mediaRequirements[k] === true);

  const handleSubmissionChange = (next: string | string[]) => {
    const arr = Array.isArray(next) ? next : [next];
    update({
      mediaRequirements: {
        ...value.mediaRequirements,
        headshots: arr.includes('headshots'),
        fullBody: arr.includes('fullBody'),
        videoReel: arr.includes('videoReel'),
        audioSample: arr.includes('audioSample'),
      },
    });
  };

  return (
    <View style={styles.container}>
      <InputGroup label="Ancillary provided" subtitle="What is included by the hirer?">
        <TagInput
          value={(value.ancillaryProvided ?? []).join(', ')}
          onChangeTags={(v: string) =>
            update({
              ancillaryProvided: v
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder={ANCILLARY_PRESETS.slice(0, 3).join(', ')}
        />
      </InputGroup>

      <InputGroup label="Submission requirements" subtitle="What do applicants need to upload?">
        <ChipPicker
          mode="multi"
          options={SUBMISSION_OPTIONS as unknown as { label: string; value: string }[]}
          value={selectedSubmissions}
          onChange={handleSubmissionChange}
          accessibilityLabel="Submission requirements"
        />
      </InputGroup>

      <InputGroup label="Notes for applicants (optional)">
        <TextArea
          rows={2}
          value={value.mediaRequirements.notes}
          onChangeText={(v: string) =>
            update({ mediaRequirements: { ...value.mediaRequirements, notes: v } })
          }
          placeholder="e.g. please include a recent performance video"
        />
      </InputGroup>

      <DatePickerInput
        label="Application deadline (optional)"
        value={value.applicationDeadline ?? ''}
        onChange={(d: Date) =>
          update({ applicationDeadline: dayjs(d).format('YYYY-MM-DD') })
        }
        placeholder="Select date"
        minimumDate={new Date()}
      />

      <InputGroup label="Max applicants (optional)">
        <StyledTextInput
          icon={Users}
          inputMode="numeric"
          value={value.maxApplicants ?? ''}
          onChangeText={(v: string) => update({ maxApplicants: v })}
          placeholder="e.g. 50"
        />
      </InputGroup>

      {/* Description with AI rephrase */}
      <View>
        <InputGroup label="Description" subtitle="What's this gig about?">
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
      </View>

      <InputGroup label="Perks (optional)" subtitle="What else do performers get?">
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

      {/* T&C with AI rephrase */}
      <View>
        <InputGroup label="Terms & conditions" subtitle="Expectations, cancellation, payment terms">
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
            rows={4}
            value={value.termsAndConditions}
            onChangeText={(v: string) => update({ termsAndConditions: v })}
            placeholder="Payment split, cancellation policy, expectations..."
          />
        </InputGroup>
      </View>
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
