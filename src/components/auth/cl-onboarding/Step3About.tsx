// Step 3 — optional. Bio + specialties/services.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SearchableMultiSelect } from '@/components/inputs/SearchableMultiSelect';
import type { CLOFormData } from '@/types/clOnboarding';

interface Props {
  data: CLOFormData;
  update: (patch: Partial<CLOFormData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

const SERVICES_OPTIONS = [
  // Dance & Choreography
  { value: 'Sangeet Choreography',    label: 'Sangeet Choreography' },
  { value: 'Wedding Choreography',    label: 'Wedding Choreography' },
  { value: 'Classical Dance',         label: 'Classical Dance' },
  { value: 'Bollywood Dance',         label: 'Bollywood Dance' },
  { value: 'Folk Dance',              label: 'Folk Dance' },
  { value: 'Contemporary Dance',      label: 'Contemporary Dance' },
  // Music
  { value: 'Live Band',               label: 'Live Band' },
  { value: 'Classical Music',         label: 'Classical Music' },
  { value: 'Bollywood / Film Music',  label: 'Bollywood / Film Music' },
  { value: 'Ghazal & Sufi',          label: 'Ghazal & Sufi' },
  { value: 'Bhajans & Devotional',    label: 'Bhajans & Devotional' },
  { value: 'Folk Music',              label: 'Folk Music' },
  { value: 'Fusion Music',            label: 'Fusion Music' },
  { value: 'DJ',                      label: 'DJ' },
  // Theatre & Drama
  { value: 'Theatre Production',      label: 'Theatre Production' },
  { value: 'Street Theatre',          label: 'Street Theatre' },
  { value: 'Musical Theatre',         label: 'Musical Theatre' },
  { value: 'Mime & Physical Theatre', label: 'Mime & Physical Theatre' },
  // Comedy & Spoken Word
  { value: 'Stand-up Comedy',         label: 'Stand-up Comedy' },
  { value: 'Storytelling',            label: 'Storytelling' },
  { value: 'Spoken Word / Poetry',    label: 'Spoken Word / Poetry' },
  { value: 'Improv Comedy',           label: 'Improv Comedy' },
  // Anchoring & Hosting
  { value: 'Wedding Anchoring',       label: 'Wedding Anchoring' },
  { value: 'Corporate Anchoring',     label: 'Corporate Anchoring' },
  { value: 'Award Shows',             label: 'Award Shows' },
  { value: 'Cultural Festivals',      label: 'Cultural Festivals' },
  { value: 'Fashion Shows',           label: 'Fashion Shows' },
  { value: 'Sports Events',           label: 'Sports Events' },
  { value: 'Product Launches',        label: 'Product Launches' },
  // Visual & Variety
  { value: 'Magic & Illusionism',     label: 'Magic & Illusionism' },
  { value: 'Acrobatics & Circus',     label: 'Acrobatics & Circus' },
  { value: 'Puppetry',                label: 'Puppetry' },
  { value: 'Photography',             label: 'Photography' },
  // Production & Management
  { value: 'Artist Management',       label: 'Artist Management' },
  { value: 'Talent Booking',          label: 'Talent Booking' },
  { value: 'Event Management',        label: 'Event Management' },
  { value: 'Creative Direction',      label: 'Creative Direction' },
  { value: 'Film & Ad Production',    label: 'Film & Ad Production' },
  { value: 'Music Production',        label: 'Music Production' },
  { value: 'Stage Design & Decor',    label: 'Stage Design & Decor' },
];

export default function Step3About({ data, update, onNext, onSkip }: Props) {
  const [focused, setFocused] = useState(false);

  function toggleService(v: string) {
    const next = data.services.includes(v)
      ? data.services.filter(s => s !== v)
      : [...data.services, v];
    update({ services: next });
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.headline}>About your{'\n'}company</Text>
        <Text style={s.sub}>Help hirers and artists understand what you do.</Text>

        {/* Bio */}
        <Text style={s.label}>BIO</Text>
        <TextInput
          style={[s.bioInput, focused && s.bioFocused]}
          placeholder="Tell people about your company — what you create, who you work with, what makes you distinct."
          placeholderTextColor="rgba(245,245,240,0.22)"
          value={data.bio}
          onChangeText={v => update({ bio: v })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline
          textAlignVertical="top"
          returnKeyType="default"
        />
        <Text style={s.charCount}>{data.bio.length} / 500</Text>

        {/* Services */}
        <Text style={[s.label, { marginTop: 24 }]}>SPECIALTIES</Text>
        <Text style={s.fieldSub}>What kinds of performances or events does your company work with?</Text>
        <SearchableMultiSelect
          selected={data.services}
          options={SERVICES_OPTIONS}
          onToggle={toggleService}
          placeholder="Select specialties"
          searchPlaceholder="Search or add your own…"
          emptyText="No specialties match."
          allowCustom
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.ctaRow}>
        <Pressable style={s.skipBtn} onPress={onSkip}>
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
        <Pressable style={s.nextBtn} onPress={onNext}>
          <Text style={s.nextText}>Next</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  scroll:     { flex: 1 },
  content:    { paddingHorizontal: 20, paddingTop: 12 },
  headline:   { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 34, color: '#F5F5F0', lineHeight: 42, marginBottom: 6 },
  sub:        { fontFamily: 'Outfit-Light', fontSize: 13, color: 'rgba(245,245,240,0.45)', lineHeight: 19, marginBottom: 28 },
  label:      { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 1.3, color: 'rgba(245,245,240,0.78)', marginBottom: 8 },
  fieldSub:   { fontFamily: 'Outfit-Light', fontSize: 12, color: 'rgba(245,245,240,0.35)', marginBottom: 10, lineHeight: 17 },
  bioInput:   { backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Outfit-Regular', fontSize: 14, color: '#F5F5F0', minHeight: 110, lineHeight: 21 },
  bioFocused: { borderColor: '#FF6B35' },
  charCount:  { fontFamily: 'SpaceMono-Regular', fontSize: 9, color: 'rgba(245,245,240,0.18)', textAlign: 'right', marginTop: 6 },
  ctaRow:     { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, backgroundColor: '#121216' },
  skipBtn:    { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  skipText:   { fontFamily: 'Outfit-Regular', fontSize: 14, color: 'rgba(245,245,240,0.45)' },
  nextBtn:    { flex: 2, paddingVertical: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#FF6B35' },
  nextText:   { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#0A0A0F' },
});
