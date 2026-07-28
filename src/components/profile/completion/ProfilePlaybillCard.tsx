import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useProfileCompletion } from './useProfileCompletion';
import { useProfileNudgeStore } from '@/stores/profileNudgeStore';
import ProfileInterviewSheet from './ProfileInterviewSheet';

const C = {
  surface: '#131218', hair: 'rgba(255,255,255,0.10)', hairSoft: 'rgba(255,255,255,0.06)',
  cream: '#F0ECE6', muted: '#8C857B', orange: '#FF6B35',
};

const ProfilePlaybillCard: React.FC = () => {
  const { score, missing, blanks } = useProfileCompletion();
  const isVisible = useProfileNudgeStore((s) => s.isPlaybillVisible(score, missing.length));
  const dismiss = useProfileNudgeStore((s) => s.dismissPlaybill);
  const [interviewOpen, setInterviewOpen] = useState(false);

  if (!isVisible) return null;

  const blankCount = blanks.length || missing.length;

  return (
    <>
      <Pressable
        onPress={() => setInterviewOpen(true)}
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.hair, borderRadius: 16, padding: 18, margin: 16, position: 'relative' }}
      >
        <Pressable onPress={() => dismiss(score)} accessibilityLabel="dismiss" hitSlop={12}
          style={{ position: 'absolute', top: 10, right: 10, padding: 4 }}>
          <X size={16} color={C.muted} />
        </Pressable>

        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 3, color: C.orange, textTransform: 'uppercase', marginBottom: 8 }}>
          Now Performing
        </Text>
        {/* headline is Outfit-Bold (not DM Serif) — see DESIGN system v3 for the eyebrow/headline pairing. */}
        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 22, color: C.cream, marginBottom: 4 }}>
          {`${blankCount} blank${blankCount === 1 ? '' : 's'} left on your playbill`}
        </Text>
        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: C.muted, marginBottom: 14 }}>
          A few taps and hirers see the real you.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(blanks.length ? blanks : missing).slice(0, 4).map((f) => (
            <View key={f.id} style={{ borderWidth: 1, borderColor: C.hairSoft, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }}>
              <Text style={{ color: C.cream, fontFamily: 'Outfit-Medium', fontSize: 11 }}>{f.chipLabel}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 16, alignSelf: 'flex-start', backgroundColor: C.orange, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16 }}>
          <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 13 }}>Fill the next blank →</Text>
        </View>
      </Pressable>

      <ProfileInterviewSheet
        visible={interviewOpen}
        fields={missing}
        onClose={() => setInterviewOpen(false)}
        onComplete={() => setInterviewOpen(false)}
      />
    </>
  );
};

export default ProfilePlaybillCard;
