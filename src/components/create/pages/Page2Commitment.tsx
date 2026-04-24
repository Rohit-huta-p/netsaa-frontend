// netsa-mobile/src/components/create/pages/Page2Commitment.tsx
//
// Page 2 of the GigForm v2 flow. Date + location + compensation +
// duration + (conditional) language preference. Pattern adapted from
// Page1Identity styling + MusicBlock's checkbox treatment.
//
// Per Wave 4 brief: compensation model and compensation structure chip
// rows use the shared ChipPicker primitive in single-select mode with
// `{label, value}` options so labels ("Total", "Per day", "To be
// discussed") can differ from backing values ("fixed", "per-day", "tbd").

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, IndianRupee, Clock, Check } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import StyledTextInput from '@/components/ui/StyledTextInput';
import ChipPicker from '@/components/ui/ChipPicker';
import { MapLinkCard } from '@/components/location/MapLinkCard';
import dayjs from 'dayjs';

export type CompensationModel = 'fixed' | 'hourly' | 'per-day' | 'per-track' | 'per-shoot';
export type CompensationStructure = 'fixed' | 'range' | 'tbd';

export interface Page2Value {
  startDate: string;
  endDate?: string;
  city: string;
  venue?: string;
  address?: string;
  compensationModel: CompensationModel;
  compensationStructure: CompensationStructure;
  amount?: string;
  minAmount?: string;
  maxAmount?: string;
  negotiable: boolean;
  duration?: string;
  languagePreferences?: string[];
}

export interface Page2CommitmentProps {
  artistTypes: string[]; // determines language chips reveal
  value: Page2Value;
  onChange: (next: Page2Value) => void;
}

const LANGUAGE_SENSITIVE_TYPES = new Set(['Singer', 'Emcee', 'Actor']);

const COMP_MODEL_OPTIONS = [
  { label: 'Total', value: 'fixed' },
  { label: 'Hourly', value: 'hourly' },
  { label: 'Per day', value: 'per-day' },
  { label: 'Per track', value: 'per-track' },
  { label: 'Per shoot', value: 'per-shoot' },
] as const;

const COMP_STRUCTURE_OPTIONS = [
  { label: 'Fixed amount', value: 'fixed' },
  { label: 'Range', value: 'range' },
  { label: 'To be discussed', value: 'tbd' },
] as const;

export default function Page2Commitment({ artistTypes, value, onChange }: Page2CommitmentProps) {
  const update = (patch: Partial<Page2Value>) => onChange({ ...value, ...patch });
  const showLanguage = artistTypes.some((t) => LANGUAGE_SENSITIVE_TYPES.has(t));

  const handleStructureChange = (next: string | string[]) => {
    const picked = (Array.isArray(next) ? next[0] : next) as CompensationStructure;
    if (!picked) return;
    update({
      compensationStructure: picked,
      ...(picked === 'fixed' ? { minAmount: '', maxAmount: '' } : {}),
      ...(picked === 'range' ? { amount: '' } : {}),
    });
  };

  return (
    <View style={styles.container}>
      {/* Date row */}
      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <DatePickerInput
            label="Start date"
            value={value.startDate}
            onChange={(d: Date) => update({ startDate: dayjs(d).format('YYYY-MM-DD') })}
            placeholder="Select date"
            minimumDate={new Date()}
          />
        </View>
        <View style={{ flex: 1 }}>
          <DatePickerInput
            label="End date (optional)"
            value={value.endDate ?? ''}
            onChange={(d: Date) => update({ endDate: dayjs(d).format('YYYY-MM-DD') })}
            placeholder="Select date"
            minimumDate={value.startDate ? new Date(value.startDate) : new Date()}
          />
        </View>
      </View>

      {/* Location */}
      <InputGroup label="City">
        <StyledTextInput
          icon={MapPin}
          value={value.city}
          onChangeText={(v: string) => update({ city: v })}
          placeholder="e.g. Mumbai, Pune, Bangalore"
        />
      </InputGroup>
      <InputGroup label="Venue (optional)">
        <StyledTextInput
          value={value.venue ?? ''}
          onChangeText={(v: string) => update({ venue: v })}
          placeholder="e.g. Grand Ballroom, XYZ Hotel"
        />
      </InputGroup>
      <InputGroup label="Address (optional)">
        <StyledTextInput
          value={value.address ?? ''}
          onChangeText={(v: string) => update({ address: v })}
          placeholder="Street, area, landmark"
        />
      </InputGroup>
      {value.venue && value.city && (
        <MapLinkCard
          venueName={value.venue}
          address={value.address ?? ''}
          city={value.city}
          state="State"
          country="India"
        />
      )}

      {/* Compensation unit */}
      <InputGroup label="Payment unit">
        <ChipPicker
          mode="single"
          options={COMP_MODEL_OPTIONS as unknown as { label: string; value: string }[]}
          value={value.compensationModel}
          onChange={(next) => {
            const picked = (Array.isArray(next) ? next[0] : next) as CompensationModel;
            if (picked) update({ compensationModel: picked });
          }}
          accessibilityLabel="Payment unit"
        />
      </InputGroup>

      {/* Compensation structure */}
      <InputGroup label="Payment structure">
        <ChipPicker
          mode="single"
          options={COMP_STRUCTURE_OPTIONS as unknown as { label: string; value: string }[]}
          value={value.compensationStructure}
          onChange={handleStructureChange}
          accessibilityLabel="Payment structure"
        />
      </InputGroup>

      {value.compensationStructure === 'fixed' && (
        <InputGroup label="Amount (INR)">
          <StyledTextInput
            icon={IndianRupee}
            inputMode="numeric"
            value={value.amount ?? ''}
            onChangeText={(v: string) => update({ amount: v })}
            placeholder="e.g. 5000"
          />
        </InputGroup>
      )}
      {value.compensationStructure === 'range' && (
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <InputGroup label="Min (INR)">
              <StyledTextInput
                inputMode="numeric"
                value={value.minAmount ?? ''}
                onChangeText={(v: string) => update({ minAmount: v })}
                placeholder="e.g. 3000"
              />
            </InputGroup>
          </View>
          <View style={{ flex: 1 }}>
            <InputGroup label="Max (INR)">
              <StyledTextInput
                inputMode="numeric"
                value={value.maxAmount ?? ''}
                onChangeText={(v: string) => update({ maxAmount: v })}
                placeholder="e.g. 8000"
              />
            </InputGroup>
          </View>
        </View>
      )}

      <TouchableOpacity onPress={() => update({ negotiable: !value.negotiable })} style={styles.checkbox}>
        <View style={[styles.checkboxBox, value.negotiable && styles.checkboxBoxActive]}>
          {value.negotiable && <Check size={14} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>Open to negotiate</Text>
      </TouchableOpacity>

      <InputGroup label="Duration / time commitment (optional)">
        <StyledTextInput
          icon={Clock}
          value={value.duration ?? ''}
          onChangeText={(v: string) => update({ duration: v })}
          placeholder="e.g. 2 hours"
        />
      </InputGroup>

      {showLanguage && (
        <InputGroup label="Language preference" subtitle="For audience-facing performers">
          <TagInput
            value={(value.languagePreferences ?? []).join(', ')}
            onChangeTags={(v: string) =>
              update({
                languagePreferences: v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Hindi, English, Marathi..."
          />
        </InputGroup>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  row2: { flexDirection: 'row', gap: 10 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#52525B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  checkboxLabel: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#D4D4D8' },
});
