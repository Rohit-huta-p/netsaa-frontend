// netsa-mobile/src/components/create/pages/Page2Commitment.tsx
//
// Page 2 of the GigForm v2 flow ("When & where"). Date (single row + an
// optional "＋ End date" reveal for multi-day gigs) + a grouped Location
// card + the (conditional) language preference.
//
// v2: compensation and duration moved OUT of this step. Location is now a
// single grouped card — Venue → Address → City | State (one row) with the
// map baked in — so it reads as one section, not four separate inputs.
// State is a picker of Indian states (replaces the old hard-coded value).
// The compensation fields still live on `Page2Value` (same state slice the
// Compensation step reads/writes); this page just no longer renders them.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MapPin, CalendarPlus, X, ChevronDown, Check } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import { TagInput } from '@/components/ui/TagInput';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { MapLinkCard } from '@/components/location/MapLinkCard';
import { INDIAN_STATES } from '@/constants/indianStates';
import dayjs from 'dayjs';

export type CompensationModel = 'fixed' | 'hourly' | 'per-day' | 'per-track' | 'per-shoot';
export type CompensationStructure = 'fixed' | 'range' | 'tbd';

export interface Page2Value {
  startDate: string;
  endDate?: string;
  city: string;
  venue?: string;
  address?: string;
  /** v2 — Indian state; replaces the old hard-coded "Maharashtra". */
  state?: string;
  // ── Compensation (edited on the dedicated Compensation step) ──
  compensationModel: CompensationModel;
  compensationStructure: CompensationStructure;
  amount?: string;
  minAmount?: string;
  maxAmount?: string;
  negotiable: boolean;
  languagePreferences?: string[];
}

export interface Page2CommitmentProps {
  artistTypes: string[]; // determines language chips reveal
  value: Page2Value;
  onChange: (next: Page2Value) => void;
}

const LANGUAGE_SENSITIVE_TYPES = new Set(['Singer', 'Emcee', 'Actor']);

export default function Page2Commitment({ artistTypes, value, onChange }: Page2CommitmentProps) {
  const update = (patch: Partial<Page2Value>) => onChange({ ...value, ...patch });
  const showLanguage = artistTypes.some((t) => LANGUAGE_SENSITIVE_TYPES.has(t));
  const [showEnd, setShowEnd] = useState(!!value.endDate);
  const [stateOpen, setStateOpen] = useState(false);

  return (
    <View style={styles.container}>
      {/* Date — single primary field + optional end-date reveal */}
      <InputGroup label="Date" required>
        <DatePickerInput
          label=""
          value={value.startDate}
          onChange={(d: Date) => update({ startDate: dayjs(d).format('YYYY-MM-DD') })}
          placeholder="Select date"
          minimumDate={new Date()}
        />
        {showEnd ? (
          <View style={styles.endRow}>
            <View style={{ flex: 1 }}>
              <DatePickerInput
                label="End date"
                value={value.endDate ?? ''}
                onChange={(d: Date) => update({ endDate: dayjs(d).format('YYYY-MM-DD') })}
                placeholder="Select end date"
                minimumDate={value.startDate ? new Date(value.startDate) : new Date()}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowEnd(false);
                update({ endDate: '' });
              }}
              style={styles.removeEnd}
              accessibilityRole="button"
              accessibilityLabel="Remove end date"
            >
              <X size={16} color="#A1A1AA" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowEnd(true)}
            style={styles.addEnd}
            accessibilityRole="button"
            accessibilityLabel="Add end date for a multi-day gig"
          >
            <CalendarPlus size={15} color="#FF6B35" />
            <Text style={styles.addEndText}>Add end date</Text>
          </TouchableOpacity>
        )}
      </InputGroup>

      {/* Location — one grouped card: Venue → Address → City | State + map */}
      <View>
        <View style={styles.locLabel}>
          <MapPin size={14} color="#FF6B35" />
          <Text style={styles.locLabelText}>Location</Text>
          <Text style={styles.req}> *</Text>
        </View>
        <View style={styles.locCard}>
          <View style={styles.locRow}>
            <Text style={styles.locKey}>Venue</Text>
            <TextInput
              style={styles.locInput}
              value={value.venue ?? ''}
              onChangeText={(v) => update({ venue: v })}
              placeholder="The Grand Ballroom"
              placeholderTextColor="#54545c"
              accessibilityLabel="Venue"
            />
          </View>
          <View style={[styles.locRow, styles.rowDivider]}>
            <Text style={styles.locKey}>Address</Text>
            <TextInput
              style={styles.locInput}
              value={value.address ?? ''}
              onChangeText={(v) => update({ address: v })}
              placeholder="Street, area, landmark"
              placeholderTextColor="#54545c"
              accessibilityLabel="Address"
            />
          </View>
          <View style={[styles.locSplit, styles.rowDivider]}>
            <View style={styles.locCell}>
              <Text style={styles.locKey}>City</Text>
              <TextInput
                style={styles.locInput}
                value={value.city}
                onChangeText={(v) => update({ city: v })}
                placeholder="e.g. Pune"
                placeholderTextColor="#54545c"
                accessibilityLabel="City"
              />
            </View>
            <TouchableOpacity
              style={[styles.locCell, styles.cellDivider]}
              onPress={() => setStateOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`State: ${value.state || 'Select'}`}
            >
              <Text style={styles.locKey}>State</Text>
              <Text style={[styles.locStateVal, !value.state && styles.locStatePlaceholder]}>
                {value.state || 'Select'}
              </Text>
              <ChevronDown size={15} color="#52525B" />
            </TouchableOpacity>
          </View>
          {!!value.venue && !!value.city && (
            <View style={styles.locMapWrap}>
              <MapLinkCard
                venueName={value.venue}
                address={value.address ?? ''}
                city={value.city}
                state={value.state || 'Maharashtra'}
                country="India"
              />
            </View>
          )}
        </View>
      </View>

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

      {/* State picker — bottom sheet */}
      <Modal
        visible={stateOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setStateOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setStateOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select state</Text>
              <TouchableOpacity onPress={() => setStateOpen(false)} accessibilityLabel="Close">
                <Text style={styles.sheetClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {INDIAN_STATES.map((s) => {
                const active = value.state === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={styles.stateItem}
                    onPress={() => {
                      update({ state: s });
                      setStateOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.stateItemText, active && styles.stateItemActive]}>{s}</Text>
                    {active && <Check size={16} color="#FF6B35" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  endRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 },
  removeEnd: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.32)',
    backgroundColor: 'rgba(255,107,53,0.10)',
  },
  addEndText: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: '#FF6B35' },

  // ── grouped Location card ──
  locLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  locLabelText: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F0F0F2', letterSpacing: -0.2 },
  req: { color: '#FF6B35', fontFamily: 'Outfit-SemiBold', fontSize: 15 },
  locCard: {
    backgroundColor: '#0B0B0F',
    borderWidth: 1,
    borderColor: '#262630',
    borderRadius: 13,
    overflow: 'hidden',
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.055)' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, height: 50 },
  locKey: { width: 62, fontFamily: 'Outfit-SemiBold', fontSize: 11, color: '#8B8B99' },
  locInput: { flex: 1, fontFamily: 'Outfit-Regular', fontSize: 14, color: '#FFFFFF', paddingVertical: 0 },
  locSplit: { flexDirection: 'row' },
  locCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50 },
  cellDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.055)' },
  locStateVal: { flex: 1, fontFamily: 'Outfit-Regular', fontSize: 14, color: '#FFFFFF' },
  locStatePlaceholder: { color: '#54545c' },
  locMapWrap: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.055)', padding: 10 },

  // ── state picker sheet ──
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F0F14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '75%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontFamily: 'Outfit-Bold', fontSize: 18, color: '#FFFFFF' },
  sheetClose: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#FF6B35' },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  stateItemText: { fontFamily: 'Outfit-Regular', fontSize: 15, color: '#D4D4D8' },
  stateItemActive: { fontFamily: 'Outfit-SemiBold', color: '#FF6B35' },
});
