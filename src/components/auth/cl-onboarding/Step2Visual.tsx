// Step 2 — optional. Logo (1:1) + cover (3:2) upload.
import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  StyleSheet, Dimensions, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
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
      const res = await uploadMediaFlow({ asset, entityType: 'user', entityId: userId, purpose: 'logo' });
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

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.headline}>Your visual{'\n'}identity</Text>
        <Text style={s.sub}>First impressions matter. Add a logo and a cover to complete your page.</Text>

        {/* Logo */}
        <Text style={s.label}>LOGO</Text>
        <Pressable style={s.logoWrap} onPress={pickLogo} disabled={loadingLogo}>
          {data.logoUrl ? (
            <Image source={{ uri: data.logoUrl }} style={s.logoImg} contentFit="cover" />
          ) : (
            <View style={s.logoEmpty}>
              {loadingLogo
                ? <ActivityIndicator color="#FF6B35" />
                : <Camera size={22} color="rgba(245,245,240,0.3)" />
              }
            </View>
          )}
          {data.logoUrl && (
            <View style={s.reuploadBadge}>
              <Camera size={12} color="#F5F5F0" />
            </View>
          )}
        </Pressable>
        <Text style={s.hint}>Square logo, min 400 × 400 px</Text>

        {/* Cover */}
        <Text style={[s.label, { marginTop: 24 }]}>COVER IMAGE</Text>
        <Pressable style={[s.coverWrap, { height: (W - 40) * (2 / 3) }]} onPress={pickCover} disabled={loadingCover}>
          {data.coverUrl ? (
            <Image source={{ uri: data.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={s.coverEmpty}>
              {loadingCover
                ? <ActivityIndicator color="#FF6B35" />
                : <>
                    <Camera size={26} color="rgba(245,245,240,0.25)" />
                    <Text style={s.coverHint}>Tap to add a cover photo</Text>
                  </>
              }
            </View>
          )}
        </Pressable>
        <Text style={s.hint}>Landscape 3:2 — 1500 × 1000 px ideal</Text>

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

      <MediaCropper {...cropperProps} />
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { flex: 1 },
  content:      { paddingHorizontal: 20, paddingTop: 12 },
  headline:     { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 34, color: '#F5F5F0', lineHeight: 42, marginBottom: 6 },
  sub:          { fontFamily: 'Outfit-Light', fontSize: 13, color: 'rgba(245,245,240,0.45)', lineHeight: 19, marginBottom: 28 },
  label:        { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1.4, color: 'rgba(245,245,240,0.28)', marginBottom: 10 },
  hint:         { fontFamily: 'Outfit-Light', fontSize: 11, color: 'rgba(245,245,240,0.25)', marginTop: 6 },
  logoWrap:     { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  logoImg:      { width: 80, height: 80, borderRadius: 12 },
  logoEmpty:    { width: 80, height: 80, borderRadius: 12, backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  reuploadBadge:{ position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(18,18,22,0.75)', alignItems: 'center', justifyContent: 'center' },
  coverWrap:    { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' },
  coverEmpty:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverHint:    { fontFamily: 'Outfit-Light', fontSize: 12, color: 'rgba(245,245,240,0.3)' },
  ctaRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, backgroundColor: '#121216' },
  skipBtn:      { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  skipText:     { fontFamily: 'Outfit-Regular', fontSize: 14, color: 'rgba(245,245,240,0.45)' },
  nextBtn:      { flex: 2, paddingVertical: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#FF6B35' },
  nextText:     { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#0A0A0F' },
});
