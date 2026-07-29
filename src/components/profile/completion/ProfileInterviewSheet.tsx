// netsa-frontend/src/components/profile/completion/ProfileInterviewSheet.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TextInput, ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Image as LucideImage, Play } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AITextInput } from '@/components/ui/AITextInput';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useProfileUiStore } from '@/stores/profileUiStore';
import { uploadMediaFlow, uploadVideoFlow, validateMediaFile } from '@/utils/upload';
import type { InterviewField } from './interviewFieldMeta';

interface ProfileInterviewSheetProps {
  visible: boolean;
  fields: InterviewField[];
  onClose: () => void;
  onComplete: (savedIds: string[]) => void;
}

const C = {
  surface: '#131218', hair: 'rgba(255,255,255,0.10)', cream: '#F0ECE6',
  muted: '#8C857B', orange: '#FF6B35', orangeSoft: 'rgba(255,107,53,0.14)',
};

// Palette lifted from ProfileScreen's Portfolio bento so the preview reads as the
// same surface the photos will land on.
const PREVIEW_GRADS: [string, string, string][] = [
  ['#1a1520', '#2d1f3d', '#1a2030'], ['#201518', '#3d1f2d', '#201a30'],
  ['#15201a', '#1f3d2d', '#1a3020'], ['#202015', '#3d3d1f', '#30201a'],
  ['#201520', '#3d1f3d', '#301a30'], ['#152020', '#1f3d3d', '#1a3030'],
];

// Per-media-step requirement + copy. `optional` steps never block Next (the user
// can skip); required steps unlock Next once `min` items exist. Mirrors the
// profile apply gate (meetsMinimumApplyGate): 2 gallery photos, 1 video reel.
const MEDIA_CFG: Record<string, { min: number; optional: boolean; add: string; more: string; noun: string }> = {
  photo: { min: 1, optional: false, add: 'Add your photo', more: 'Replace photo', noun: 'photo' },
  gallery: { min: 2, optional: false, add: 'Add a photo', more: 'Add another', noun: 'photos' },
  videoReel: { min: 1, optional: true, add: 'Add your clip', more: 'Add another clip', noun: 'clip' },
};

const pstyles = StyleSheet.create({
  item: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#1A1824', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  img: { width: '100%', height: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  play: { position: 'absolute', top: '50%', left: '50%', marginTop: -18, marginLeft: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  loaderPct: { color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 12 },
});

// One bento tile. Filled → the uploaded photo (or a video-reel thumbnail with a
// play badge); empty → a gradient placeholder with a faint image glyph (mirrors
// ProfileScreen's BentoSlot). `loading` overlays a spinner + percent on the tile
// currently receiving an upload.
const BentoTile = ({ w, h, grad, big, url, isVideo, processing, loading, pct, onPress }: {
  w: number; h: number; grad: [string, string, string]; big?: boolean;
  url?: string; isVideo?: boolean; processing?: boolean; loading?: boolean; pct?: number; onPress?: () => void;
}) => (
  <Pressable onPress={onPress} disabled={!onPress || loading || processing} style={[pstyles.item, { width: w, height: h }]}>
    {url ? (
      <Image source={{ uri: url }} style={pstyles.img} />
    ) : (
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pstyles.img}>
        <View style={pstyles.center}>
          <LucideImage size={big ? 28 : 20} color="rgba(255,255,255,0.06)" strokeWidth={1.5} />
        </View>
      </LinearGradient>
    )}
    {url && isVideo && !processing && (
      <View style={pstyles.play}><Play size={14} color="#fff" fill="#fff" /></View>
    )}
    {processing && (
      <View style={pstyles.loader}>
        <ActivityIndicator color={C.orange} />
        <Text style={pstyles.loaderPct}>Processing</Text>
      </View>
    )}
    {loading && (
      <View style={pstyles.loader}>
        <ActivityIndicator color={C.orange} />
        {pct ? <Text style={pstyles.loaderPct}>{pct}%</Text> : null}
      </View>
    )}
  </Pressable>
);

/**
 * MediaBentoPreview — a compact echo of the profile Portfolio bento (large 2×2 +
 * two stacked squares, then a row of three). Tiles fill, in order, with the media
 * already uploaded for this step; the first empty tile is the upload target (it
 * shows a spinner + percent while a file is uploading). Empty tiles open the picker.
 */
const MediaBentoPreview = ({ media, uploading, uploadPct, onPick }: {
  media: { url: string; isVideo: boolean; processing?: boolean }[]; uploading: boolean; uploadPct: number; onPick: () => void;
}) => {
  const { width } = useWindowDimensions();
  const GAP = 8;
  const gridW = Math.min(width - 40, 300); // sheet inner width (20px padding each side), capped
  const col = (gridW - GAP * 2) / 3;
  const col2 = col * 2 + GAP;
  const targetIdx = media.length; // first empty slot = where the next upload lands

  const tile = (i: number, w: number, h: number, big?: boolean) => (
    <BentoTile
      w={w}
      h={h}
      grad={PREVIEW_GRADS[i]}
      big={big}
      url={media[i]?.url}
      isVideo={media[i]?.isVideo}
      processing={media[i]?.processing}
      loading={uploading && i === targetIdx}
      pct={uploadPct}
      onPress={media[i] ? undefined : onPick}
    />
  );

  return (
    <View style={{ alignSelf: 'center', marginBottom: 16 }}>
      {/* Row 1: large 2×2 + 2 stacked squares */}
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {tile(0, col2, col2, true)}
        <View style={{ gap: GAP }}>
          {tile(1, col, col)}
          {tile(2, col, col)}
        </View>
      </View>
      {/* Row 2: 3 squares */}
      <View style={{ flexDirection: 'row', gap: GAP, marginTop: GAP }}>
        {tile(3, col, col)}
        {tile(4, col, col)}
        {tile(5, col, col)}
      </View>
    </View>
  );
};

function payloadFor(field: InterviewField, text: string, selected: string[]): Partial<any> {
  switch (field.id) {
    case 'displayName': return { displayName: text.trim() };
    case 'location': return { location: text.trim() };
    case 'bio': return { bio: text.trim() };
    case 'artistType': return { artistType: selected[0] };
    case 'skills': return { skills: selected };
    case 'experience': return { experience: [{ role: text.trim(), date: '' }] };
    default: return {};
  }
}

const ProfileInterviewSheet: React.FC<ProfileInterviewSheetProps> = ({ visible, fields, onClose, onComplete }) => {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [uploadPct, setUploadPct] = useState(0);

  // Reactive so the preview re-fills the instant an upload updates the store.
  const authUser = useAuthStore((s) => s.user) as any;

  const field = fields[idx];

  useEffect(() => {
    if (visible) {
      setIdx(0);
      setText('');
      setSelected([]);
      setError(null);
      setSavedIds([]);
      setUploadPct(0);
    }
  }, [visible]);

  // A 'verify' field (email verification) has no in-sheet input — it's
  // account security, not profile content. Hand off to the edit-modal's
  // Verify section instead of trying to collect it here.
  useEffect(() => {
    if (!visible || !field || field.inputType !== 'verify') return;
    onClose();
    useProfileUiStore.getState().openSheet(field.section);
  }, [visible, field?.inputType, field?.section, onClose]);

  // The preview mirrors the profile Portfolio bento exactly — gallery photos +
  // ready video-reel thumbnails — on EVERY media step, so it always shows what the
  // user already sees on their profile (not just the current step's own field).
  const media: { url: string; isVideo: boolean; processing?: boolean }[] = React.useMemo(() => {
    const gallery = ((authUser?.galleryUrls as string[]) || [])
      .filter(Boolean)
      .map((url) => ({ url, isVideo: false }));
    // Ready reels show their thumbnail; a still-processing reel (just uploaded via
    // Mux) shows a "Processing" tile so the clip is visibly acknowledged in-session.
    const reels = ((authUser?.videoReels as any[]) || [])
      .filter((r) => r && (r.status === 'ready' || r.status === 'processing'))
      .map((r) => ({ url: (r.thumbnailUrl as string) || '', isVideo: true, processing: r.status !== 'ready' }));
    return [...gallery, ...reels];
  }, [authUser]);

  if (!visible) return null;
  if (!field) return null;
  if (field.inputType === 'verify') return null; // handoff happens in the effect above

  const advance = (savedId?: string) => {
    const nextSaved = savedId ? [...savedIds, savedId] : savedIds;
    setSavedIds(nextSaved);
    setText(''); setSelected([]); setError(null);
    if (idx + 1 >= fields.length) { onComplete(nextSaved); return; }
    setIdx(idx + 1);
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const payload = payloadFor(field, text, selected);
      const updatedUser = await authService.updateProfile(payload);
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setAuth({
          user: { ...user, ...updatedUser },
          accessToken: useAuthStore.getState().accessToken || '',
        });
      }
      advance(field.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not save — try again.');
    } finally {
      setSaving(false);
    }
  };

  const commitUser = (updatedUser: any) => {
    const cur = useAuthStore.getState().user;
    if (cur) {
      useAuthStore.getState().setAuth({
        user: { ...cur, ...updatedUser },
        accessToken: useAuthStore.getState().accessToken || '',
      });
    }
  };

  const pickAndUploadMedia = async () => {
    const isVideo = field.id === 'videoReel';
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isVideo ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: field.id === 'photo',
      aspect: field.id === 'photo' ? [1, 1] : [16, 9],
      quality: 0.8,
      ...(isVideo ? { videoMaxDuration: 60 } : {}),
    });
    if (result.canceled) return;
    const asset = result.assets[0];

    const v = validateMediaFile(asset, isVideo);
    if (!v.valid) { setError(v.error || "That file won't work."); return; }

    setSaving(true); setError(null); setUploadPct(0);
    const user = useAuthStore.getState().user as any;
    const entityId = user?._id || user?.id || '';

    try {
      if (isVideo) {
        // Route through Mux so the clip becomes a real videoReel that counts on
        // the profile (the legacy videoUrls path never populated videoReels).
        const up = await uploadVideoFlow({ asset, entityType: 'user', entityId, purpose: 'portfolio' });
        if (!up.success || !up.uploadId) { setError(up.error || 'Upload failed — try again.'); return; }
        const nextReels = [
          ...((user?.videoReels as any[]) || []),
          { muxPlaybackId: '', status: 'processing' as const, uploadId: up.uploadId },
        ].slice(0, 3);
        commitUser(await authService.updateProfile({ videoReels: nextReels }));
      } else {
        const purpose = field.id === 'photo' ? ('avatar' as const) : ('gallery' as const);
        const up = await uploadMediaFlow({ asset, entityType: 'user', entityId, purpose, onProgress: setUploadPct });
        if (!up.success || !up.url) { setError(up.error || 'Upload failed — try again.'); return; }
        const payload = field.id === 'photo'
          ? { profileImageUrl: up.url }
          : { galleryUrls: [...((user?.galleryUrls as string[]) || []).filter(Boolean), up.url] };
        commitUser(await authService.updateProfile(payload));
      }
      // No advance() here — the user keeps adding until the minimum is met, then
      // taps Next (footer) to move on. Auto-advance-after-one is what we removed.
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not save — try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (v: string) => setSelected((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  // Media-step progress → gates the Next button. `mediaCount` reads the same
  // sources as the profile apply gate; processing reels count so an uploaded clip
  // registers immediately.
  const mediaCfg = field.inputType === 'media' ? MEDIA_CFG[field.id] : undefined;
  const mediaCount = !mediaCfg
    ? 0
    : field.id === 'photo'
      ? (authUser?.profileImageUrl ? 1 : 0)
      : field.id === 'gallery'
        ? ((authUser?.galleryUrls as string[]) || []).filter(Boolean).length
        : field.id === 'videoReel'
          ? ((authUser?.videoReels as any[]) || []).filter((r) => r && (r.status === 'ready' || r.status === 'processing')).length
          : 0;
  const minMet = !mediaCfg || mediaCfg.optional || mediaCount >= mediaCfg.min;
  const isLast = idx + 1 >= fields.length;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderColor: C.hair, padding: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 11, letterSpacing: 1.5, color: C.muted }}>
              {`YOUR STORY · ${idx + 1} of ${fields.length}`}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}><X size={18} color={C.muted} /></Pressable>
          </View>

          <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 20, color: C.cream, marginBottom: 16, lineHeight: 26 }}>
            {field.question}
          </Text>

          {field.inputType === 'text' && (
            field.id === 'bio' ? (
              // Bio gets the multiline composer + AI rephrase (same AITextInput the
              // Edit modal's BioComposer wraps), not the one-line input.
              <AITextInput
                value={text}
                onChangeText={setText}
                placeholder="Your craft, your style, and what makes you unforgettable on stage…"
                containerStyle={{ marginBottom: 16 }}
              />
            ) : (
              <TextInput
                value={text} onChangeText={setText}
                placeholder="Type your answer…" placeholderTextColor={C.muted}
                style={{ borderWidth: 1, borderColor: C.hair, borderRadius: 12, padding: 14, color: C.cream, fontFamily: 'Outfit-Regular', fontSize: 15, marginBottom: 16 }}
              />
            )
          )}

          {(field.inputType === 'chips' || field.inputType === 'multiselect') && (
            <ScrollView horizontal={false} style={{ maxHeight: 180, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(field.chips || []).map((c) => {
                  const active = field.inputType === 'chips' ? false : selected.includes(c);
                  return (
                    <Pressable key={c}
                      onPress={() => (field.inputType === 'chips' ? advanceChips(c) : toggle(c))}
                      style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1,
                        borderColor: active ? C.orange : C.hair, backgroundColor: active ? C.orangeSoft : 'transparent' }}>
                      <Text style={{ color: active ? C.orange : C.cream, fontFamily: 'Outfit-Medium', fontSize: 13 }}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {field.inputType === 'media' && (
            <>
              <MediaBentoPreview media={media} uploading={saving} uploadPct={uploadPct} onPick={pickAndUploadMedia} />
              <Text style={{ color: C.muted, fontFamily: 'Outfit-Regular', fontSize: 13, marginBottom: 16 }}>
                {saving
                  ? (field.id === 'videoReel' ? 'Uploading your clip…' : `Uploading… ${uploadPct}%`)
                  : mediaCfg?.optional && mediaCount === 0
                    ? 'Optional — add a clip, or tap Next to skip.'
                    : !minMet
                      ? `Add at least ${mediaCfg?.min} ${mediaCfg?.noun} · ${mediaCount}/${mediaCfg?.min} added`
                      : `${mediaCount} ${mediaCfg?.noun} added`}
              </Text>
            </>
          )}

          {error && <Text style={{ color: '#F0736B', fontSize: 12, marginBottom: 10 }}>{error}</Text>}

          {field.inputType === 'media' ? (
            saving ? (
              <View style={{ backgroundColor: C.orange, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : !minMet ? (
              // Required min not met → the only action is to keep adding.
              <Pressable onPress={pickAndUploadMedia}
                style={{ backgroundColor: C.orange, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 15 }}>{mediaCfg?.add}</Text>
              </Pressable>
            ) : (
              // Min met (or optional) → offer "add another" + the Next/Done CTA.
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {mediaCount < 6 && (
                  <Pressable onPress={pickAndUploadMedia}
                    style={{ flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.hair }}>
                    <Text style={{ color: C.cream, fontFamily: 'Outfit-Medium', fontSize: 15 }}>{mediaCount === 0 ? mediaCfg?.add : mediaCfg?.more}</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => advance(mediaCount > 0 ? field.id : undefined)}
                  style={{ flex: mediaCount < 6 ? 2 : 1, backgroundColor: C.orange, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 15 }}>{isLast ? 'Done' : 'Next'}</Text>
                </Pressable>
              </View>
            )
          ) : (
            <Pressable onPress={save} disabled={saving}
              style={{ backgroundColor: C.orange, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 15 }}>{isLast ? 'Done' : 'Save'}</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );

  // single-select chip: save immediately, then advance
  async function advanceChips(value: string) {
    setSelected([value]);
    setSaving(true); setError(null);
    try {
      const payload = payloadFor(field, '', [value]);
      const updatedUser = await authService.updateProfile(payload);
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setAuth({ user: { ...user, ...updatedUser }, accessToken: useAuthStore.getState().accessToken || '' });
      }
      advance(field.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not save — try again.');
    } finally { setSaving(false); }
  }
};

export default ProfileInterviewSheet;
