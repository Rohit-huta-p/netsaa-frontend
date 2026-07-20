// netsa-frontend/src/components/profile/completion/ProfileInterviewSheet.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useProfileUiStore } from '@/stores/profileUiStore';
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
  const openSheet = useProfileUiStore((s) => s.openSheet);

  useEffect(() => {
    if (visible) {
      setIdx(0);
      setText('');
      setSelected([]);
      setError(null);
      setSavedIds([]);
    }
  }, [visible]);

  if (!visible) return null;
  const field = fields[idx];
  if (!field) return null;

  const advance = (savedId?: string) => {
    const nextSaved = savedId ? [...savedIds, savedId] : savedIds;
    setSavedIds(nextSaved);
    setText(''); setSelected([]); setError(null);
    if (idx + 1 >= fields.length) { onComplete(nextSaved); return; }
    setIdx(idx + 1);
  };

  const save = async () => {
    if (field.inputType === 'media') {
      onClose();
      openSheet('media'); // hand off to the existing upload flow
      return;
    }
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
              We'll open your gallery to add this.
            </Text>
          )}

          {error && <Text style={{ color: '#F0736B', fontSize: 12, marginBottom: 10 }}>{error}</Text>}

          <Pressable onPress={save} disabled={saving}
            style={{ backgroundColor: C.orange, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 15 }}>
                {field.inputType === 'media' ? 'Add it' : idx + 1 >= fields.length ? 'Done' : 'Save'}
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
