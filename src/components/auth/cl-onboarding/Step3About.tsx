// CL Step 3 (register step 6) — optional. Bio + specialties/services.
import React from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SearchableMultiSelect } from '@/components/inputs/SearchableMultiSelect';
import type { CLOFormData } from '@/types/clOnboarding';
import {
  AccentProvider, StepHeader, Field, PrimaryButton, RK, RK_FONT,
} from '@/components/auth/register-kit';

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
  function toggleService(v: string) {
    const next = data.services.includes(v)
      ? data.services.filter(s => s !== v)
      : [...data.services, v];
    update({ services: next });
  }

  return (
    <AccentProvider role="creative_lead">
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
          <StepHeader title={'About your\ncompany'} sub="Help hirers and artists understand what you do." />

          <Field
            label="BIO"
            multiline
            value={data.bio}
            onChangeText={v => update({ bio: v })}
            placeholder="Tell people about your company — what you create, who you work with, what makes you distinct."
            counter={`${data.bio.length} / 500`}
            maxLength={500}
          />

          {/* Services */}
          <Text style={[s.label, { marginTop: 8 }]}>SPECIALTIES</Text>
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

          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={s.footer}>
          <PrimaryButton label="Next" onPress={onNext} />
          <Pressable onPress={onSkip} style={s.skipLink}>
            <Text style={s.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AccentProvider>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 24, paddingTop: 12 },
  label:    { fontFamily: RK_FONT.mono, fontSize: 9, letterSpacing: 1.6, color: RK.muted, marginBottom: 7 },
  fieldSub: { fontFamily: RK_FONT.body, fontSize: 12, color: RK.dim, marginBottom: 10, lineHeight: 17 },
  footer:   { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, backgroundColor: RK.bg },
  skipLink: { paddingVertical: 10, alignItems: 'center' },
  skipText: { fontFamily: RK_FONT.body, fontSize: 13, color: RK.muted },
});
