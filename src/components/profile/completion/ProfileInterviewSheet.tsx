// netsa-frontend/src/components/profile/completion/ProfileInterviewSheet.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useProfileUiStore } from '@/stores/profileUiStore';
import { uploadMediaFlow, validateMediaFile } from '@/utils/upload';
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

  const pickAndUploadMedia = async () => {
    const isVideo = field.id === 'videoReel';
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isVideo ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: field.id === 'photo',
      aspect: field.id === 'photo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];

    const v = validateMediaFile(asset, isVideo);
    if (!v.valid) { setError(v.error || "That file won't work."); return; }

    setSaving(true); setError(null); setUploadPct(0);
    const user = useAuthStore.getState().user;
    const purpose = field.id === 'photo' ? 'avatar' as const : isVideo ? 'portfolio' as const : 'gallery' as const;
    const up = await uploadMediaFlow({
      asset,
      entityType: 'user',
      entityId: (user as any)?._id || (user as any)?.id || '',
      purpose,
      onProgress: setUploadPct,
    });
    if (!up.success || !up.url) {
      setError(up.error || 'Upload failed — try again.');
      setSaving(false);
      return;
    }

    let payload: Partial<any> = {};
    if (field.id === 'photo') {
      payload = { profileImageUrl: up.url };
    } else if (field.id === 'gallery') {
      payload = { galleryUrls: [...((user as any)?.galleryUrls || []).filter(Boolean), up.url] };
    } else if (field.id === 'videoReel') {
      payload = { videoUrls: [...((user as any)?.videoUrls || []).filter(Boolean), up.url] };
    }

    try {
      const updatedUser = await authService.updateProfile(payload);
      const cur = useAuthStore.getState().user;
      if (cur) {
        useAuthStore.getState().setAuth({
          user: { ...cur, ...updatedUser },
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

  const toggle = (v: string) => setSelected((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

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
            <TextInput
              value={text} onChangeText={setText}
              placeholder="Type your answer…" placeholderTextColor={C.muted}
              style={{ borderWidth: 1, borderColor: C.hair, borderRadius: 12, padding: 14, color: C.cream, fontFamily: 'Outfit-Regular', fontSize: 15, marginBottom: 16 }}
            />
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
            <Text style={{ color: C.muted, fontFamily: 'Outfit-Regular', fontSize: 13, marginBottom: 16 }}>
              {saving ? `Uploading… ${uploadPct}%` : "Pick from your gallery — we'll upload it right away."}
            </Text>
          )}

          {error && <Text style={{ color: '#F0736B', fontSize: 12, marginBottom: 10 }}>{error}</Text>}

          <Pressable onPress={field.inputType === 'media' ? pickAndUploadMedia : save} disabled={saving}
            style={{ backgroundColor: C.orange, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
            {saving ? (
              field.inputType === 'media'
                ? <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 15 }}>{`${uploadPct}%`}</Text>
                : <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 15 }}>
                {field.inputType === 'media'
                  ? (field.id === 'photo' ? 'Add your photo' : field.id === 'videoReel' ? 'Add your clip' : 'Add a photo')
                  : idx + 1 >= fields.length ? 'Done' : 'Save'}
              </Text>
            )}
          </Pressable>
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
