// src/components/events/detail/MeetingLinkRevealCard.tsx
//
// Online-event join-link card (mockup L4). Renders ONLY for online events.
//
//   Locked   (!event.meetingLinkRevealed) → lock + "unlocks {when}" copy
//   Revealed (meetingLinkRevealed && location.meetingLink) → link + Join + Copy
//
// The backend strips location.meetingLink until the reveal window opens (D7),
// so a present meetingLink + meetingLinkRevealed is the source of truth.

import React, { useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Lock, ExternalLink, Copy, Check } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';

// ----------------------------------------------------------------- palette
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#6B6878';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const ORANGE = '#FF6B35';
const GREEN = '#22C55E';

const REVEAL_COPY: Record<string, string> = {
  on_register: 'once you register',
  'T-24h': '24 hours before it starts',
  'T-1h': '1 hour before it starts',
};

interface Props {
  event: EventDoc;
}

export default function MeetingLinkRevealCard({ event }: Props) {
  const [copied, setCopied] = useState(false);

  if (event.location?.kind !== 'online') return null;

  const link = event.location?.meetingLink;
  const revealed = !!event.meetingLinkRevealed && !!link;

  const onCopy = async () => {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View
      style={{
        backgroundColor: '#15131C',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: revealed ? 'rgba(34,197,94,0.25)' : HAIRLINE,
        padding: 18,
        marginTop: 24,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {revealed ? <ExternalLink size={16} color={GREEN} /> : <Lock size={16} color={TEXT_2} />}
        <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 13, color: revealed ? GREEN : TEXT_2, letterSpacing: 0.3 }}>
          {revealed ? 'Online event · join link ready' : 'Online event'}
        </Text>
      </View>

      {revealed ? (
        <>
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'JetBrainsMono-Regular', fontSize: 12.5, color: TEXT_0 }}
          >
            {link}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => link && Linking.openURL(link)}
              accessibilityRole="button"
              accessibilityLabel="Join the online event now"
              style={{
                flex: 1,
                backgroundColor: ORANGE,
                borderRadius: 11,
                paddingVertical: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <ExternalLink size={15} color="#1A0F0A" />
              <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#1A0F0A' }}>Join now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCopy}
              accessibilityRole="button"
              accessibilityLabel="Copy join link"
              style={{
                width: 48,
                borderRadius: 11,
                borderWidth: 1,
                borderColor: HAIRLINE,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {copied ? <Check size={16} color={GREEN} /> : <Copy size={16} color={TEXT_2} />}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: TEXT_0, lineHeight: 19 }}>
          Join link unlocks {REVEAL_COPY[event.location?.meetingLinkRevealAt ?? 'on_register'] ?? 'before the event'}.
          {'  '}
          <Text style={{ color: TEXT_2 }}>We&apos;ll push + email it to you.</Text>
        </Text>
      )}
    </View>
  );
}
