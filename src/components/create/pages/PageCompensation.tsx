// netsa-mobile/src/components/create/pages/PageCompensation.tsx
//
// Step 4 of the GigForm v2 flow ("Compensation"). Split out of Page 2 so
// pay stops crowding "When & where". Reads/writes the compensation fields
// on `Page2Value` (same state slice — no payload change).
//
// UX: a segmented mode switch (Fixed / Range / Decide later); the pay unit
// lives *inside* the amount input as a tappable pill (per performer / per
// day / per hour…); the Negotiable checkbox sits on the Amount label line;
// an Estimated-total helper multiplies by headcount.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { IndianRupee, ArrowLeftRight, Clock, Check, ChevronDown } from 'lucide-react-native';
import { InputGroup } from '@/components/ui/InputGroup';
import type { Page2Value, CompensationModel, CompensationStructure } from './Page2Commitment';

export interface PageCompensationProps {
  value: Page2Value;
  onChange: (next: Page2Value) => void;
  artistTypes: string[];
  headcount?: number;
}

const STRUCTURE_OPTIONS: { label: string; value: CompensationStructure; Icon: any }[] = [
  { label: 'Fixed', value: 'fixed', Icon: IndianRupee },
  { label: 'Range', value: 'range', Icon: ArrowLeftRight },
  { label: 'Decide later', value: 'tbd', Icon: Clock },
];

// Full unit enum, filtered by performer type so a dance hirer never sees
// "per track" (producer) or "per shoot" (model/photo). `fixed` reads as
// "Per performer" — the amount is what each performer is paid.
const ALL_UNITS: { label: string; value: CompensationModel; types?: string[] }[] = [
  { label: 'Per performer', value: 'fixed' },
  { label: 'Per day', value: 'per-day' },
  { label: 'Per hour', value: 'hourly' },
  { label: 'Per track', value: 'per-track', types: ['Music Producer', 'Musician', 'Singer'] },
  { label: 'Per shoot', value: 'per-shoot', types: ['Model', 'Photographer', 'Videographer'] },
];

export default function PageCompensation({
  value,
  onChange,
  artistTypes,
  headcount,
}: PageCompensationProps) {
  const update = (patch: Partial<Page2Value>) => onChange({ ...value, ...patch });
  const [unitOpen, setUnitOpen] = useState(false);

  const handleStructure = (picked: CompensationStructure) => {
    update({
      compensationStructure: picked,
      ...(picked === 'fixed' ? { minAmount: '', maxAmount: '' } : {}),
      ...(picked === 'range' ? { amount: '' } : {}),
    });
  };

  const unitOptions = ALL_UNITS.filter(
    (u) => !u.types || u.types.some((t) => artistTypes.includes(t))
  );
  const currentUnit = unitOptions.find((u) => u.value === value.compensationModel) ?? unitOptions[0];

  const structure = value.compensationStructure;
  const amt = parseInt(value.amount ?? '', 10);
  const n = headcount ?? 0;
  const showTotal = structure === 'fixed' && Number.isFinite(amt) && amt > 0 && n > 0;
  const total = showTotal ? amt * n : 0;

  const unitPill = (full?: boolean) => (
    <TouchableOpacity
      style={[styles.unitPill, full && styles.unitPillFull]}
      onPress={() => setUnitOpen((o) => !o)}
      accessibilityRole="button"
      accessibilityLabel={`Payment unit: ${currentUnit?.label ?? ''}`}
    >
      <Text style={styles.unitPillText}>{currentUnit?.label ?? 'Per performer'}</Text>
      <ChevronDown size={14} color="#8B8B99" />
    </TouchableOpacity>
  );

  const unitMenu = unitOpen ? (
    <View style={styles.unitMenu}>
      {unitOptions.map((u) => {
        const active = currentUnit?.value === u.value;
        return (
          <TouchableOpacity
            key={u.value}
            style={styles.unitMenuItem}
            onPress={() => {
              update({ compensationModel: u.value });
              setUnitOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.unitMenuText, active && styles.unitMenuTextOn]}>{u.label}</Text>
            {active && <Check size={14} color="#FF6B35" />}
          </TouchableOpacity>
        );
      })}
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      {/* Structure — segmented mode switch */}
      <InputGroup label="How's it paid?" required>
        <View style={styles.seg}>
          {STRUCTURE_OPTIONS.map(({ label, value: v, Icon }) => {
            const active = structure === v;
            return (
              <TouchableOpacity
                key={v}
                onPress={() => handleStructure(v)}
                style={[styles.segOpt, active && styles.segOptOn]}
                accessibilityRole="button"
                accessibilityLabel={`Payment structure: ${label}`}
                accessibilityState={{ selected: active }}
              >
                <Icon size={16} color={active ? '#fff' : '#6A6A76'} />
                <Text style={[styles.segTxt, active && styles.segTxtOn]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </InputGroup>

      {/* Amount — label row carries the Negotiable checkbox on the right */}
      <View style={styles.group}>
        <View style={styles.amountHeader}>
          <Text style={styles.amountLabel}>
            Amount <Text style={styles.req}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.negBtn}
            onPress={() => update({ negotiable: !value.negotiable })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!value.negotiable }}
            accessibilityLabel="Open to negotiate"
          >
            <View style={[styles.negBox, value.negotiable && styles.negBoxOn]}>
              {value.negotiable && <Check size={12} color="#fff" />}
            </View>
            <Text style={styles.negText}>Negotiable</Text>
          </TouchableOpacity>
        </View>

        {structure === 'fixed' && (
          <>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={value.amount ?? ''}
                onChangeText={(v) => update({ amount: v })}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
                accessibilityLabel="Amount"
              />
              {unitPill()}
            </View>
            {unitMenu}
          </>
        )}

        {structure === 'range' && (
          <>
            <View style={styles.rangeRow}>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  value={value.minAmount ?? ''}
                  onChangeText={(v) => update({ minAmount: v })}
                  placeholder="Min"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  accessibilityLabel="Minimum amount"
                />
              </View>
              <Text style={styles.dash}>–</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  value={value.maxAmount ?? ''}
                  onChangeText={(v) => update({ maxAmount: v })}
                  placeholder="Max"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  accessibilityLabel="Maximum amount"
                />
              </View>
            </View>
            {unitPill(true)}
            {unitMenu}
          </>
        )}

        {structure === 'tbd' && (
          <Text style={styles.tbdNote}>You'll agree the amount with the artist after they apply.</Text>
        )}
      </View>

      {/* Estimated total — headcount × amount */}
      {showTotal && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Estimated total</Text>
          <Text style={styles.totalValue}>
            {n} × ₹{amt.toLocaleString('en-IN')} = ₹{total.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.totalSub}>
            On payout, Razorpay Route splits instantly — 88% artist, 12% platform fee. NETSA never holds the money.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  group: { gap: 10 },
  // segmented control
  seg: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#0C0C11',
    borderWidth: 1,
    borderColor: '#262630',
  },
  segOpt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 9,
  },
  segOptOn: { backgroundColor: '#FF6B35' },
  segTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: '#AEAEBA' },
  segTxtOn: { color: '#FFFFFF' },
  // amount header (label + negotiate)
  amountHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F0F0F2', letterSpacing: -0.2 },
  req: { color: '#FF6B35' },
  negBtn: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  negBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#52525B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  negBoxOn: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  negText: { fontFamily: 'Outfit-Medium', fontSize: 12.5, color: '#A1A1AA' },
  // amount input row (well) with inline unit pill
  amountRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    height: 50,
  },
  currency: { fontFamily: 'Outfit-Medium', fontSize: 17, color: '#71717A' },
  amountInput: { flex: 1, color: '#FFFFFF', fontFamily: 'Outfit-Regular', fontSize: 16, paddingVertical: 0 },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1C1C25',
    borderWidth: 1,
    borderColor: '#34343F',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  unitPillFull: { alignSelf: 'flex-start', marginTop: 10 },
  unitPillText: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: '#E4E4EA' },
  unitMenu: {
    marginTop: 8,
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: '#262630',
    borderRadius: 12,
    overflow: 'hidden',
  },
  unitMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  unitMenuText: { fontFamily: 'Outfit-Medium', fontSize: 13.5, color: '#D0D0D9' },
  unitMenuTextOn: { color: '#FF6B35', fontFamily: 'Outfit-SemiBold' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dash: { color: '#52525B', fontSize: 16 },
  tbdNote: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#A1A1AA', lineHeight: 19 },
  // estimated total
  totalCard: {
    backgroundColor: 'rgba(255,107,53,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
    borderRadius: 12,
    padding: 14,
    gap: 5,
  },
  totalLabel: {
    fontFamily: 'Outfit-Black',
    fontSize: 10,
    color: '#FF6B35',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: { fontFamily: 'Outfit-Bold', fontSize: 16, color: '#FFFFFF' },
  totalSub: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#A1A1AA', lineHeight: 16 },
});
