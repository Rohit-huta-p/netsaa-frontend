// CL Step 2 (register step 5) — optional. Cover + logo as a contextual profile header preview.
import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Dimensions, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Image as ImageIcon, Info } from 'lucide-react-native';
import { usePickAndCrop } from '@/hooks/usePickAndCrop';
import { uploadMediaFlow } from '@/utils/upload';
import MediaCropper from '@/components/media/MediaCropper';
import useAuthStore from '@/stores/authStore';
import type { CLOFormData } from '@/types/clOnboarding';
import {
  AccentProvider, ROLE_ACCENT, StepHeader, PrimaryButton, Note, RK, RK_FONT,
} from '@/components/auth/register-kit';

const CL = ROLE_ACCENT.creative_lead;

interface Props {
  data: CLOFormData;
  update: (patch: Partial<CLOFormData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

const W = Dimensions.get('window').width;
const COVER_H = 116;
const LOGO_SIZE = Math.round(W * 0.25);
const LOGO_HALF   = LOGO_SIZE / 2;
const LOGO_RADIUS = Math.round(LOGO_SIZE * 0.24);

export default function Step2Visual({ data, update, onNext, onSkip }: Props) {
  const [loadingLogo,  setLoadingLogo]  = useState(false);
  const [loadingCover, setLoadingCover] = useState(false);
  const { pickAndCrop, cropperProps }   = usePickAndCrop();
  const userId = useAuthStore(s => s.user?._id ?? '');

  async function pickLogo() {
    setLoadingLogo(true);
    try {
      const asset = await pickAndCrop('logo');
      if (!asset) return;
      const res = await uploadMediaFlow({ asset, entityType: 'user', entityId: userId, purpose: 'avatar' });
      if (res?.url) update({ logoUrl: res.url });
    } catch {
      Alert.alert('Upload failed', 'Could not upload logo. Please try again.');
    } finally {
      setLoadingLogo(false);
    }
  }

  async function pickCover() {
    setLoadingCover(true);
    try {
      const asset = await pickAndCrop('cover');
      if (!asset) return;
      const res = await uploadMediaFlow({ asset, entityType: 'user', entityId: userId, purpose: 'banner' });
      if (res?.url) update({ coverUrl: res.url });
    } catch {
      Alert.alert('Upload failed', 'Could not upload cover. Please try again.');
    } finally {
      setLoadingCover(false);
    }
  }

  const orgName = data.organizationName?.trim() || 'Your company';
  const orgMeta = [data.organizerTypeCategory, data.city?.trim()].filter(Boolean).join(' · ');

  return (
    <AccentProvider role="creative_lead">
      <View style={s.root}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <StepHeader title={'Visual\nidentity'} sub="Tap each area to set your cover and logo." />

          {/* ── Contextual profile header preview ── */}
          <View style={s.headerWrap}>
            <Pressable style={s.coverBanner} onPress={pickCover} disabled={loadingCover}>
              {data.coverUrl ? (
                <Image source={{ uri: data.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                loadingCover
                  ? <ActivityIndicator color={CL.border} />
                  : <>
                      <ImageIcon size={22} color={RK.dim} strokeWidth={1.5} />
                      <Text style={s.coverTapText}>Tap to set cover</Text>
                      <Text style={s.coverDimText}>16 : 9 · 1500 × 844 px</Text>
                    </>
              )}
            </Pressable>

            <View style={s.logoRow}>
              <Pressable style={s.logoOuter} onPress={pickLogo} disabled={loadingLogo}>
                <View style={s.logoInner}>
                  {data.logoUrl ? (
                    <Image source={{ uri: data.logoUrl }} style={s.logoImg} contentFit="cover" />
                  ) : (
                    loadingLogo
                      ? <ActivityIndicator color={CL.border} size="small" />
                      : <>
                          <ImageIcon size={14} color={RK.dim} strokeWidth={1.5} />
                          <Text style={s.logoLabel}>Logo{'\n'}1:1</Text>
                        </>
                  )}
                </View>
              </Pressable>

              <View style={s.nameMeta}>
                <Text style={s.orgName} numberOfLines={1}>{orgName}</Text>
                {!!orgMeta && <Text style={s.orgMeta} numberOfLines={1}>{orgMeta}</Text>}
              </View>
            </View>
          </View>

          <Note variant="muted" icon={<Info size={13} color={RK.dim} strokeWidth={1.75} />}>
            This is how your profile header appears to artists and hirers. You can update it anytime from settings.
          </Note>

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* CTA */}
        <View style={s.footer}>
          <PrimaryButton label="Continue" onPress={onNext} />
          <Pressable onPress={onSkip} style={s.skipLink}>
            <Text style={s.skipText}>Skip for now</Text>
          </Pressable>
        </View>

        <MediaCropper {...cropperProps} />
      </View>
    </AccentProvider>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 12 },

  /* ─── Profile header ─── */
  headerWrap: { marginBottom: 18 },
  coverBanner: {
    width: '100%', height: COVER_H, backgroundColor: RK.surface,
    borderWidth: 1.5, borderColor: RK.hair2, borderStyle: 'dashed', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden',
  },
  coverTapText: { fontFamily: RK_FONT.body, fontSize: 11.5, color: RK.muted },
  coverDimText: { fontFamily: RK_FONT.mono, fontSize: 10, color: RK.dim },

  logoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 14, marginTop: -(LOGO_HALF), zIndex: 1 },
  logoOuter: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_RADIUS, backgroundColor: RK.bg, padding: 3, flexShrink: 0 },
  logoInner: {
    flex: 1, borderRadius: LOGO_RADIUS - 3, backgroundColor: RK.surface,
    borderWidth: 1.5, borderColor: RK.hair2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden',
  },
  logoImg:  { width: LOGO_SIZE - 6, height: LOGO_SIZE - 6, borderRadius: LOGO_RADIUS - 3 },
  logoLabel:{ fontFamily: RK_FONT.mono, fontSize: 7.5, color: RK.dim, textAlign: 'center', lineHeight: 13 },

  nameMeta: { paddingBottom: 5, flex: 1, minWidth: 0 },
  orgName:  { fontFamily: RK_FONT.serif, fontSize: 19, color: RK.cream, lineHeight: 24, marginBottom: 3 },
  orgMeta:  { fontFamily: RK_FONT.mono, fontSize: 10, color: RK.muted, textTransform: 'uppercase', letterSpacing: 1.3 },

  /* ─── CTA ─── */
  footer:   { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, backgroundColor: RK.bg },
  skipLink: { paddingVertical: 10, alignItems: 'center' },
  skipText: { fontFamily: RK_FONT.body, fontSize: 13, color: RK.muted },
});
