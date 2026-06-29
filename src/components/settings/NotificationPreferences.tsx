// src/components/settings/NotificationPreferences.tsx
//
// 3×3 matrix of event-notification preference toggles.
// Rows: Reminders · Announcements · Reviews
// Cols: Push · Email · SMS
//
// Loading: ActivityIndicator. Toggle: optimistic local update → PATCH API →
// reconcile on success / revert on error.
//
// Palette matches the surrounding notifications settings screen (inbox-rhythm):
//   BG surface rgba(255,255,255,0.03), text-0 #f4f4f5, text-2 #71717a,
//   orange #FF6B35.

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  eventNotifPrefsApi,
  type NotifPrefs,
  type NotifPrefsCategory,
  type NotifPrefsChannel,
} from '@/services/api/eventNotifPrefsApi';

// ---------------------------------------------------------------------- types

const ROWS: { key: NotifPrefsCategory; label: string }[] = [
  { key: 'reminders', label: 'Reminders' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'reviews', label: 'Reviews' },
];

const COLS: { key: NotifPrefsChannel; label: string }[] = [
  { key: 'push', label: 'Push' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
];

const DEFAULT_PREFS: NotifPrefs = {
  reminders: { push: true, email: true, sms: true },
  announcements: { push: true, email: true, sms: false },
  reviews: { push: true, email: true, sms: false },
};

// ---------------------------------------------------------------------- colors

const BG = '#09090b';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const SURFACE = 'rgba(255,255,255,0.03)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const ORANGE = '#FF6B35';

// ---------------------------------------------------------------------- component

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await eventNotifPrefsApi.getPrefs();
        if (mounted) setPrefs(data);
      } catch {
        // Graceful fallback to defaults — prefs are non-critical
        if (mounted) setPrefs(DEFAULT_PREFS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleToggle = useCallback(
    async (
      category: NotifPrefsCategory,
      channel: NotifPrefsChannel,
      value: boolean,
    ) => {
      if (!prefs) return;

      // Optimistic update
      const prev = prefs;
      const next: NotifPrefs = {
        ...prefs,
        [category]: { ...prefs[category], [channel]: value },
      };
      setPrefs(next);

      try {
        const updated = await eventNotifPrefsApi.updatePrefs({
          [category]: { [channel]: value },
        });
        setPrefs(updated);
      } catch {
        // Revert on failure
        setPrefs(prev);
      }
    },
    [prefs],
  );

  if (loading) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={ORANGE} />
      </View>
    );
  }

  if (!prefs) return null;

  return (
    <View>
      {/* Column headers */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
      >
        {/* Row label spacer */}
        <View style={{ flex: 1 }} />
        {COLS.map((col) => (
          <View
            key={col.key}
            style={{ width: 64, alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: 'Outfit-SemiBold',
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: TEXT_2,
              }}
            >
              {col.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid rows */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderRadius: 12,
          marginHorizontal: 16,
          overflow: 'hidden',
        }}
      >
        {ROWS.map((row, rowIdx) => (
          <View
            key={row.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: rowIdx === 0 ? 0 : 1,
              borderTopColor: HAIRLINE,
            }}
          >
            {/* Row label */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Outfit-Medium',
                  fontSize: 14,
                  color: TEXT_0,
                }}
              >
                {row.label}
              </Text>
            </View>

            {/* Toggle per channel */}
            {COLS.map((col) => (
              <View
                key={col.key}
                style={{ width: 64, alignItems: 'center' }}
              >
                <Switch
                  value={prefs[row.key][col.key]}
                  onValueChange={(v) => handleToggle(row.key, col.key, v)}
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: ORANGE }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="rgba(255,255,255,0.12)"
                  accessibilityLabel={`${row.label} ${col.label} notifications`}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Footnote */}
      <Text
        style={{
          fontFamily: 'Outfit-Regular',
          fontSize: 11,
          color: TEXT_2,
          marginHorizontal: 20,
          marginTop: 8,
          lineHeight: 16,
        }}
      >
        SMS is reserved for time-sensitive reminders.
      </Text>
    </View>
  );
}
