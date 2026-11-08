// Step 2 — optional. Cover + logo as a contextual profile header preview.
// Layout mirrors the creative-lead-onboarding.html mockup (Step 2 · Visual identity).
import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Dimensions, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { usePickAndCrop } from '@/hooks/usePickAndCrop';
import { uploadMediaFlow } from '@/utils/upload';
import MediaCropper from '@/components/media/MediaCropper';
import useAuthStore from '@/stores/authStore';
import type { CLOFormData } from '@/types/clOnboarding';

interface Props {
  data: CLOFormData;
  update: (patch: Partial<CLOFormData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

const W = Dimensions.get('window').width;
const COVER_H = 116;
const LOGO_SIZE = Math.round(W * 0.25); // ~100px on 390px screens, scales with device
const LOGO_HALF   = LOGO_SIZE / 2;
const LOGO_RADIUS = Math.round(LOGO_SIZE * 0.24); // ~24px on 100px logo

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
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.headline}>Visual{'\n'}identity</Text>
        <Text style={s.sub}>Tap each area to set your cover and logo.</Text>

        {/* ── Contextual profile header preview ── */}
        <View style={s.headerWrap}>

          {/* Cover banner */}
          <Pressable style={s.coverBanner} onPress={pickCover} disabled={loadingCover}>
            {data.coverUrl ? (
              <Image source={{ uri: data.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <>
                {loadingCover
                  ? <ActivityIndicator color="#FF6B35" />
                  : <>
                      <ImageIcon size={22} color="rgba(245,245,240,0.2)" strokeWidth={1.5} />
                      <Text style={s.coverTapText}>Tap to set cover</Text>
                      <Text style={s.coverDimText}>16 : 9 · 1500 × 844 px</Text>
                    </>
                }
              </>
            )}
          </Pressable>

          {/* Logo + name row — logo overlaps cover bottom */}
          <View style={s.logoRow}>
            {/* Logo upload zone */}
            <Pressable style={s.logoOuter} onPress={pickLogo} disabled={loadingLogo}>
              <View style={s.logoInner}>
                {data.logoUrl ? (
                  <Image source={{ uri: data.logoUrl }} style={s.logoImg} contentFit="cover" />
                ) : (
                  loadingLogo
                    ? <ActivityIndicator color="#FF6B35" size="small" />
                    : <>
                        <ImageIcon size={14} color="rgba(245,245,240,0.3)" strokeWidth={1.5} />
                        <Text style={s.logoLabel}>Logo{'\n'}1:1</Text>
                      </>
                )}
              </View>
            </Pressable>

            {/* Company name + meta */}
            <View style={s.nameMeta}>
              <Text style={s.orgName} numberOfLines={1}>{orgName}</Text>
              {!!orgMeta && <Text style={s.orgMeta} numberOfLines={1}>{orgMeta}</Text>}
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={s.note}>
          <Text style={s.noteText}>
            This is exactly how your company page header will look. You can update both from your profile settings anytime.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={s.ctaRow}>
        <Pressable style={s.continueBtn} onPress={onNext}>
          <Text style={s.continueText}>Continue →</Text>
        </Pressable>
        <Pressable onPress={onSkip}>
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
      </View>

      <MediaCropper {...cropperProps} />
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { flex: 1 },
  content:      { paddingHorizontal: 20, paddingTop: 12 },

  headline:     { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 34, color: '#F5F5F0', lineHeight: 42, marginBottom: 6 },
  sub:          { fontFamily: 'Outfit-Light', fontSize: 13, color: 'rgba(245,245,240,0.45)', lineHeight: 19, marginBottom: 24 },

  /* ─── Profile header ─── */
  headerWrap:   { marginBottom: 20 },

  coverBanner:  {
    width: '100%', height: COVER_H,
    backgroundColor: '#1C1C23',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    overflow: 'hidden',
  },
  coverTapText: { fontFamily: 'Outfit-Light', fontSize: 11.5, color: 'rgba(245,245,240,0.28)' },
  coverDimText: { fontFamily: 'SpaceMono-Regular', fontSize: 10, color: 'rgba(245,245,240,0.16)' },

  logoRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
    paddingHorizontal: 14,
    marginTop: -(LOGO_HALF),
    zIndex: 1,
  },
  logoOuter: {
    width: LOGO_SIZE, height: LOGO_SIZE,
    borderRadius: LOGO_RADIUS,
    backgroundColor: '#121216',
    padding: 3,
    flexShrink: 0,
  },
  logoInner: {
    flex: 1,
    borderRadius: LOGO_RADIUS - 3,
    backgroundColor: '#1C1C23',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 3,
    overflow: 'hidden',
  },
  logoImg:  { width: LOGO_SIZE - 6, height: LOGO_SIZE - 6, borderRadius: LOGO_RADIUS - 3 },
  logoLabel:{ fontFamily: 'SpaceMono-Regular', fontSize: 7.5, color: 'rgba(245,245,240,0.22)', textAlign: 'center', lineHeight: 13 },

  nameMeta: { paddingBottom: 5, flex: 1, minWidth: 0 },
  orgName:  { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 19, color: '#F5F5F0', lineHeight: 24, marginBottom: 3 },
  orgMeta:  { fontFamily: 'SpaceMono-Regular', fontSize: 9, color: 'rgba(245,245,240,0.28)', textTransform: 'uppercase', letterSpacing: 0.7 },

  /* ─── Note ─── */
  note:     { borderLeftWidth: 2, borderLeftColor: 'rgba(255,107,53,0.2)', paddingLeft: 12, marginBottom: 8 },
  noteText: { fontFamily: 'Outfit-Light', fontSize: 12, color: 'rgba(245,245,240,0.22)', lineHeight: 18 },

  /* ─── CTA ─── */
  ctaRow:       { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, backgroundColor: '#121216', gap: 12 },
  continueBtn:  { paddingVertical: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#FF6B35' },
  continueText: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#0A0A0F' },
  skipText:     { fontFamily: 'Outfit-Regular', fontSize: 13, color: 'rgba(245,245,240,0.35)', textAlign: 'center', paddingVertical: 4 },
});
