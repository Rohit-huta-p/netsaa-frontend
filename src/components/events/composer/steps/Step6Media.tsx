import { View, Text, Pressable, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X } from 'lucide-react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import { uploadMediaFlow, uploadVideoFlow } from '@/utils/upload';
import mediaService from '@/services/mediaService';
import type { EventMedia } from '@/services/eventService';

const NETSA_FALLBACK_URL = 'netsa-fallback';
const MAX_MEDIA = 6;

const SURFACE = 'rgba(255,255,255,0.04)';
const BG_2 = '#0E0C12';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';

export default function Step6Media({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const { form, update, markComplete, editMode, editEventId } = useCreateEventStore();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const processing = form.media.filter((m) => m.kind === 'video' && m.status === 'processing' && m.uploadId);
    if (processing.length === 0) return;
    const t = setInterval(async () => {
      for (const m of processing) {
        try {
          const r = await mediaService.getAssetStatus(m.uploadId!);
          const s = r.data.status;
          if (s === 'ready' || s === 'errored') {
            update('media', form.media.map((x) => x.uploadId === m.uploadId
              ? { ...x, status: s === 'ready' ? 'ready' : 'errored', muxPlaybackId: r.data.playbackId, thumbnailUrl: r.data.playbackId ? `https://image.mux.com/${r.data.playbackId}/thumbnail.jpg?time=1` : x.thumbnailUrl }
              : x));
          }
        } catch { /* keep polling */ }
      }
    }, 4000);
    return () => clearInterval(t);
  }, [form.media, update]);

  const pick = async () => {
    if (form.media.length >= MAX_MEDIA) return;
    // Presign requires a real, persisted event the organizer owns (media-service
    // validates entityId is that event's ObjectId). In edit mode we have it
    // (editEventId); in create mode the event doesn't exist yet, so there's
    // nothing to presign against — steer to the fallback / add-after-create.
    if (!editMode || !editEventId) {
      Alert.alert(
        'Add photos after creating',
        'Publish your event first, then reopen it to add photos and video. For now you can use the NETSA fallback below.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
      videoMaxDuration: 60,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const isVideo = asset.type === 'video';
      if (isVideo) {
        const uploaded = await uploadVideoFlow({ asset, entityType: 'event', entityId: editEventId, purpose: 'gallery' });
        if (!uploaded.success || !uploaded.uploadId) throw new Error(uploaded.error ?? 'Upload failed');
        const entry: EventMedia = {
          kind: 'video', url: '', status: 'processing', uploadId: uploaded.uploadId,
          width: asset.width ?? 1080, height: asset.height ?? 1080, duration: asset.duration ?? undefined,
          isHero: form.media.length === 0, sortOrder: form.media.length,
        };
        update('media', [...form.media, entry]);
      } else {
        const uploaded = await uploadMediaFlow({ asset, entityType: 'event', entityId: editEventId, purpose: 'gallery' });
        if (!uploaded.success || !uploaded.url) throw new Error(uploaded.error ?? 'Upload returned no URL');
        const entry: EventMedia = {
          kind: 'photo', url: uploaded.url, thumbnailUrl: uploaded.url,
          width: asset.width ?? 1080, height: asset.height ?? 1080,
          isHero: form.media.length === 0, sortOrder: form.media.length,
        };
        update('media', [...form.media, entry]);
      }
    } catch {
      Alert.alert('Upload failed', 'Try again or pick a different file.');
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => {
    const next = form.media.filter((_, i) => i !== idx).map((m, i) => ({ ...m, isHero: i === 0, sortOrder: i }));
    update('media', next);
  };
  const setHero = (idx: number) => {
    update('media', form.media.map((m, i) => ({ ...m, isHero: i === idx, sortOrder: i === idx ? 0 : i + 1 })));
  };
  const useFallback = () => {
    update('media', [{ kind: 'photo', url: NETSA_FALLBACK_URL, width: 1080, height: 1080, isHero: true, sortOrder: 0 }]);
  };

  const canContinue = form.media.length >= 1;

  return (
    <View style={{ gap: 18, marginTop: 2 }}>
      <View>
        <Text style={styles.label}>Photos · video · up to 6</Text>
        <View style={styles.grid}>
          {form.media.map((m, idx) => (
            <View key={`${m.url}-${idx}`} style={styles.cell}>
              {m.kind === 'video' && m.status !== 'ready' ? (
                <View style={styles.fallbackCell}>
                  <Text style={styles.makeHeroText}>{m.status === 'errored' ? 'Failed — remove' : 'Processing…'}</Text>
                </View>
              ) : m.kind === 'video' && m.muxPlaybackId ? (
                <Image source={{ uri: m.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : m.url === NETSA_FALLBACK_URL ? (
                <View style={styles.fallbackCell}><Text style={styles.fallbackMonogram}>N</Text></View>
              ) : (
                <Image source={{ uri: m.thumbnailUrl ?? m.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )}
              <Pressable onPress={() => remove(idx)} style={styles.removeBtn}>
                <X size={13} color="#fff" />
              </Pressable>
              {m.isHero ? (
                <View style={styles.heroPill}><Text style={styles.heroPillText}>Hero</Text></View>
              ) : (
                <Pressable onPress={() => setHero(idx)} style={styles.makeHero}>
                  <Text style={styles.makeHeroText}>Make hero</Text>
                </Pressable>
              )}
            </View>
          ))}
          {form.media.length < MAX_MEDIA ? (
            <Pressable
              onPress={pick}
              disabled={uploading}
              style={styles.uploadCell}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              {uploading ? <ActivityIndicator color={ORANGE} /> : <Plus size={26} color={TEXT_2} />}
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.helper}>First photo is your hero image. Tap a photo to make it the hero.</Text>
      </View>

      {form.media.length === 0 ? (
        <Pressable onPress={useFallback} style={styles.fallbackRow}>
          <View style={styles.fallbackSwatch}><Text style={styles.fallbackSwatchText}>N</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fallbackTitle}>Use NETSA brand fallback instead</Text>
            <Text style={styles.fallbackSub}>Black background + NETSA monogram. Required at publish.</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={() => { markComplete(6); onNext(); }}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text style={[styles.continueText, !canContinue && { color: TEXT_3 }]}>Continue →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginBottom: 10 },
  helper: { fontFamily: 'Outfit-Regular', fontSize: 11, color: TEXT_3, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: BG_2 },
  fallbackCell: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  fallbackMonogram: { fontFamily: 'DMSerifDisplay_400Regular', color: ORANGE, fontSize: 28 },
  removeBtn: { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  heroPill: { position: 'absolute', bottom: 5, left: 5, backgroundColor: ORANGE, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2 },
  heroPillText: { fontFamily: 'Outfit-Bold', fontSize: 10, color: ORANGE_INK },
  makeHero: { position: 'absolute', bottom: 5, left: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 5, paddingVertical: 3, alignItems: 'center' },
  makeHeroText: { fontFamily: 'Outfit-Medium', fontSize: 10, color: '#fff' },
  uploadCell: { width: '31%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: HAIRLINE, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  fallbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 12, padding: 14 },
  fallbackSwatch: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  fallbackSwatchText: { fontFamily: 'DMSerifDisplay_400Regular', color: ORANGE, fontSize: 20 },
  fallbackTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: TEXT_0 },
  fallbackSub: { fontFamily: 'Outfit-Regular', fontSize: 11, color: TEXT_3, marginTop: 2 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: { flex: 1, height: 48, borderRadius: 11, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  continueBtn: { flex: 1, height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { backgroundColor: SURFACE },
  continueText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: ORANGE_INK },
});
