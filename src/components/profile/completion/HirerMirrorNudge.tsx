// netsa-frontend/src/components/profile/completion/HirerMirrorNudge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { X, User, Star } from 'lucide-react-native';
import { useProfileCompletion } from './useProfileCompletion';
import { useProfileNudgeStore } from '@/stores/profileNudgeStore';
import ProfileInterviewSheet from './ProfileInterviewSheet';

const C = {
  surface: '#131218',
  dim: '#0E0D12',
  hair: 'rgba(255,255,255,0.10)',
  hairSoft: 'rgba(255,255,255,0.06)',
  cream: '#F0ECE6',
  t2: '#C8C0B5',
  muted: '#8C857B',
  faint: '#57524C',
  orange: '#FF6B35',
  gold: '#F5C451',
};

// The three gaps that visibly hurt a hirer's first impression (spec §5.4 / §7).
// mirrorGaps may also include bio/gallery (mirrorRelevant) but only these three fire the nudge.
const TRIGGER_GAP_IDS = ['photo', 'artistType', 'videoReel'];

/**
 * Surface B — "The Mirror". Propless, self-gating (same shape as ProfilePlaybillCard):
 * reads completion + nudge-store state itself, renders nothing when not eligible.
 *
 * Frequency-safe visibility: eligibility is read ONCE at mount via a lazy useState
 * initializer and captured in `show`. If we instead called isMirrorEligible(...) on every
 * render, the mount-effect's markMirrorShown() would flip mirrorShownThisSession to true
 * and the very next render would immediately re-hide the card it had just shown.
 */
const HirerMirrorNudge: React.FC = () => {
  const { mirrorGaps, applyReady } = useProfileCompletion();
  const trigger = !applyReady || mirrorGaps.some((f) => TRIGGER_GAP_IDS.includes(f.id));

  const isMirrorEligible = useProfileNudgeStore((s) => s.isMirrorEligible);
  const markShown = useProfileNudgeStore((s) => s.markMirrorShown);
  const markCta = useProfileNudgeStore((s) => s.markMirrorCtaTapped);

  const [show] = useState(() => isMirrorEligible(trigger));
  const [dismissed, setDismissed] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);

  useEffect(() => {
    if (show) markShown(); // count as shown once, regardless of later re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show || dismissed) return null;

  return (
    <>
      {/* The whole card is a plain View (not Pressable) — only the × and the CTA below
          are pressable, and both are direct children here, so there's no nested-Pressable
          trap (an outer Pressable would swallow taps meant for an inner one). */}
      <View
        style={{
          margin: 16,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.hair,
          borderRadius: 18,
          paddingTop: 18,
          paddingHorizontal: 18,
          paddingBottom: 16,
        }}
      >
        <Text
          style={{
            fontFamily: 'SpaceMono-Bold',
            fontSize: 10,
            letterSpacing: 2.5,
            color: C.orange,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Before you apply
        </Text>

        <Text
          style={{
            fontFamily: 'Outfit-Medium',
            fontSize: 11,
            letterSpacing: 0.3,
            color: C.muted,
            marginBottom: 8,
          }}
        >
          How hirers see you right now
        </Text>

        {/* dim row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: C.dim,
            borderWidth: 1,
            borderColor: C.hairSoft,
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 12,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#1b1a20',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={18} color={C.faint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 14, color: '#6f6a63' }}>You</Text>
            <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11.5, color: C.faint, marginTop: 3 }}>
              No photo · no craft listed · no reel
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: 'DMSerifDisplay_400Regular',
            fontSize: 16.5,
            lineHeight: 23,
            color: C.t2,
            textAlign: 'center',
            paddingTop: 14,
            paddingHorizontal: 6,
            paddingBottom: 12,
          }}
        >
          There's not much for hirers to go on yet.
        </Text>

        {/* divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2, marginBottom: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.hairSoft }} />
          <Text
            style={{
              fontFamily: 'SpaceMono-Bold',
              fontSize: 9.5,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: C.muted,
            }}
          >
            the you they'd shortlist
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: C.hairSoft }} />
        </View>

        {/* rich row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'rgba(255,107,53,0.045)',
            borderWidth: 1,
            borderColor: 'rgba(255,107,53,0.28)',
            borderRadius: 12,
            paddingVertical: 11,
            paddingHorizontal: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: C.orange,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 15, color: '#fff' }}>KS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 14.5, color: C.cream }}>Kiran Shah</Text>
              <View style={{ backgroundColor: C.gold, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6 }}>
                <Text
                  style={{
                    fontFamily: 'SpaceMono-Bold',
                    fontSize: 8.5,
                    letterSpacing: 0.8,
                    color: '#3a2a0a',
                    textTransform: 'uppercase',
                  }}
                >
                  Trusted
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <View style={{ borderWidth: 1, borderColor: C.hairSoft, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 10.5, color: C.cream }}>Kathak</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: C.hairSoft, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 10.5, color: C.cream }}>Contemporary</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={11} color={C.gold} fill={C.gold} />
                ))}
              </View>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => {
            markCta();
            setInterviewOpen(true);
          }}
          style={{
            marginTop: 16,
            backgroundColor: C.orange,
            borderRadius: 12,
            paddingVertical: 13,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 14.5, color: '#fff' }}>Become this →</Text>
        </Pressable>

        <Pressable
          onPress={() => setDismissed(true)}
          accessibilityLabel="dismiss"
          hitSlop={16}
          style={{ position: 'absolute', top: 10, right: 12, padding: 8, zIndex: 2 }}
        >
          <X size={16} color={C.muted} />
        </Pressable>
      </View>

      <ProfileInterviewSheet
        visible={interviewOpen}
        fields={mirrorGaps}
        onClose={() => setInterviewOpen(false)}
        onComplete={() => setInterviewOpen(false)}
      />
    </>
  );
};

export default HirerMirrorNudge;
