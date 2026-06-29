// src/components/events/detail/DiscussionTabs.tsx
//
// Wraps the shared DiscussionTab component with event-level access gating.
//
// event.discussionVisibility === 'public'
//   → 2-tab switcher: Public / Attendees only
//     Public tab     → DiscussionTab (no auth gate)
//     Attendees tab  → DiscussionTab if registered, else register-to-join empty state
//
// 'attendees_only' (or undefined → treat as attendees_only)
//   → single thread; registered → DiscussionTab, else empty state
//
// DiscussionTab props: { id, type, ownerId?, inline? }
// We pass id=event._id, type='event'. ownerId is omitted (event moderation
// is not yet wired server-side per DiscussionTab comments). inline=false
// keeps the standalone card look for the event detail surface.

import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Lock } from 'lucide-react-native';
import DiscussionTab from '@/components/common/DiscussionTab';
import { useMyRegistration } from '@/hooks/useMyRegistration';
import type { EventDoc } from '@/services/eventService';

// ----------------------------------------------------------------- palette

const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#6B6878';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const ORANGE = '#FF6B35';
const TAB_ACTIVE_BG = 'rgba(255,107,53,0.12)';

// ----------------------------------------------------------------- helpers

type Tab = 'public' | 'attendees';

function RegisterToJoin() {
  return (
    <View
      style={{
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Lock size={24} color={TEXT_2} />
      <Text
        style={{
          fontFamily: 'Outfit-SemiBold',
          fontSize: 14,
          color: TEXT_0,
          textAlign: 'center',
        }}
      >
        Register to join the conversation
      </Text>
      <Text
        style={{
          fontFamily: 'Outfit-Regular',
          fontSize: 12,
          color: TEXT_2,
          textAlign: 'center',
          maxWidth: 240,
          lineHeight: 18,
        }}
      >
        This discussion is for attendees only. Register for the event to
        participate.
      </Text>
    </View>
  );
}

// ----------------------------------------------------------------- component

interface Props {
  event: EventDoc;
}

export default function DiscussionTabs({ event }: Props) {
  const { data: registration } = useMyRegistration(event._id);
  const isRegistered = registration != null;

  const isPublic = event.discussionVisibility === 'public';
  const [activeTab, setActiveTab] = useState<Tab>('public');

  if (!isPublic) {
    // attendees_only (or undefined) — single thread, gated
    return (
      <View>
        {isRegistered ? (
          <DiscussionTab id={event._id} type="event" />
        ) : (
          <View
            style={{
              backgroundColor: '#15131C',
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 20,
              marginTop: 24,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <RegisterToJoin />
          </View>
        )}
      </View>
    );
  }

  // Public visibility — 2 tabs
  return (
    <View style={{ marginTop: 24 }}>
      {/* Tab switcher */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: SURFACE,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: HAIRLINE,
          marginBottom: 4,
          padding: 4,
        }}
      >
        {(
          [
            { key: 'public' as Tab, label: 'Public' },
            { key: 'attendees' as Tab, label: 'Attendees only' },
          ] as const
        ).map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 9,
                alignItems: 'center',
                backgroundColor: active ? TAB_ACTIVE_BG : 'transparent',
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label} discussion tab`}
            >
              <Text
                style={{
                  fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular',
                  fontSize: 13,
                  color: active ? ORANGE : TEXT_2,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab content */}
      {activeTab === 'public' ? (
        <DiscussionTab id={event._id} type="event" />
      ) : isRegistered ? (
        <DiscussionTab id={event._id} type="event" />
      ) : (
        <View
          style={{
            backgroundColor: '#15131C',
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginTop: 4,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <RegisterToJoin />
        </View>
      )}
    </View>
  );
}
