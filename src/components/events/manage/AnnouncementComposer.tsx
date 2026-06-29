// src/components/events/manage/AnnouncementComposer.tsx
//
// Bottom-sheet Modal for organizers to send push/email/SMS announcements
// to a chosen audience subset.
//
// Props:
//   visible   — controls modal visibility
//   eventId   — target event _id
//   onClose   — called when the sheet is dismissed (no-op on 429)
//   onSent    — called after a successful send (caller may close + toast)
//
// Design: matches OverviewActions dark-tile palette (#11111A bg, #F3EFE8 text,
// DMSerifDisplay headline). Chips use an orange-active / muted-inactive state.
//
// Error handling:
//   429 → show backend message inline; do NOT close.
//   Other network errors → generic inline message.
//
// Behaviour:
//   - Body max 1000 chars; char counter shown.
//   - Channel chips: Push / Email / SMS. Push default ON. ≥1 required.
//   - Audience chips: All / Confirmed / Waitlist / VIP. Single-select.
//     Confirmed is the default.
//   - Send disabled while: sending, body empty, no channel selected.

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, Mail, MessageSquare, X } from 'lucide-react-native';
import { eventNotifPrefsApi } from '@/services/api/eventNotifPrefsApi';

// ----------------------------------------------------------------- types

type Channel = 'push' | 'email' | 'sms';
type Audience = 'all' | 'confirmed' | 'waitlisted' | 'vip';

interface Props {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onSent?: () => void;
}

const BODY_MAX = 1000;

const CHANNEL_META: { key: Channel; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'push', label: 'Push', Icon: Bell },
  { key: 'email', label: 'Email', Icon: Mail },
  { key: 'sms', label: 'SMS', Icon: MessageSquare },
];

const AUDIENCE_META: { key: Audience; label: string }[] = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'all', label: 'All' },
  { key: 'waitlisted', label: 'Waitlist' },
  { key: 'vip', label: 'VIP' },
];

// ----------------------------------------------------------------- palette

const BG = '#0D0D14';
const SHEET_BG = '#11111A';
const BORDER = 'rgba(243,239,232,0.09)';
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#6B6878';
const TEXT_3 = '#3D3B47';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.14)';
const SURFACE = 'rgba(255,255,255,0.04)';
const BLUE_SOFT = 'rgba(91,141,239,0.12)';
const BLUE = '#5B8DEF';
const DISABLED_BG = 'rgba(255,255,255,0.08)';

// ----------------------------------------------------------------- component

export default function AnnouncementComposer({
  visible,
  eventId,
  onClose,
  onSent,
}: Props) {
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<Set<Channel>>(new Set(['push']));
  const [audience, setAudience] = useState<Audience>('confirmed');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleChannel = useCallback((ch: Channel) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        // Must keep ≥1
        if (next.size === 1) return prev;
        next.delete(ch);
      } else {
        next.add(ch);
      }
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (sending || !body.trim() || channels.size === 0) return;
    setErrorMsg(null);
    setSending(true);

    try {
      await eventNotifPrefsApi.sendAnnouncement(eventId, {
        body: body.trim(),
        channels: Array.from(channels),
        audience,
      });
      // Reset state before signalling success
      setBody('');
      setChannels(new Set(['push']));
      setAudience('confirmed');
      onSent?.();
    } catch (err: any) {
      // 429 → show server quota message inline; don't close
      const serverMsg =
        err?.response?.data?.meta?.message ||
        err?.response?.data?.message;
      if (err?.response?.status === 429 && serverMsg) {
        setErrorMsg(serverMsg);
      } else {
        setErrorMsg(
          serverMsg || 'Failed to send announcement. Please try again.',
        );
      }
    } finally {
      setSending(false);
    }
  }, [sending, body, channels, audience, eventId, onSent]);

  const canSend = body.trim().length > 0 && channels.size > 0 && !sending;

  const audienceLabel = AUDIENCE_META.find((a) => a.key === audience)?.label ?? 'audience';
  const channelList = Array.from(channels)
    .map((ch) => CHANNEL_META.find((c) => c.key === ch)?.label ?? ch)
    .join(' + ');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Dismiss announcement composer"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          {/* Grab handle */}
          <View style={styles.grab} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>New announcement</Text>
              <Text style={styles.subtitle}>
                Goes out to the audience you pick below.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={TEXT_2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {/* Message field */}
            <Text style={styles.fieldLabel}>Message</Text>
            <View style={styles.textareaWrap}>
              <TextInput
                style={styles.textarea}
                value={body}
                onChangeText={(t) => {
                  if (t.length <= BODY_MAX) setBody(t);
                }}
                placeholder="Write your announcement…"
                placeholderTextColor={TEXT_3}
                multiline
                maxLength={BODY_MAX}
                accessibilityLabel="Announcement message"
              />
              <Text style={styles.charCount}>
                {body.length} / {BODY_MAX}
              </Text>
            </View>

            {/* Channel chips */}
            <Text style={styles.sectionLabel}>Channels</Text>
            <View style={styles.chipRow}>
              {CHANNEL_META.map(({ key, label, Icon }) => {
                const active = channels.has(key);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleChannel(key)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${label} channel ${active ? 'on' : 'off'}`}
                  >
                    <Icon
                      size={13}
                      color={active ? ORANGE : TEXT_2}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Audience chips */}
            <Text style={styles.sectionLabel}>Audience</Text>
            <View style={styles.chipRow}>
              {AUDIENCE_META.map(({ key, label }) => {
                const active = audience === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setAudience(key)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Audience: ${label}`}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info bar */}
            {!errorMsg && (
              <View style={styles.infoBar}>
                <Text style={styles.infoText}>
                  Your {audienceLabel.toLowerCase()} attendees will receive this
                  via {channelList}.
                </Text>
              </View>
            )}

            {/* Inline error (429 / network) */}
            {errorMsg ? (
              <View style={styles.errorBar}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Send button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Send announcement"
              accessibilityState={{ disabled: !canSend }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Send →</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ----------------------------------------------------------------- styles

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '90%',
  },
  grab: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    letterSpacing: -0.5,
    color: TEXT_0,
  },
  subtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_2,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 0,
  },
  fieldLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: TEXT_2,
    marginBottom: 8,
  },
  textareaWrap: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 20,
  },
  textarea: {
    color: TEXT_0,
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    lineHeight: 21,
    minHeight: 100,
    textAlignVertical: 'top',
  } as any,
  charCount: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_2,
    textAlign: 'right',
    marginTop: 6,
  },
  sectionLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: TEXT_2,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  chipActive: {
    backgroundColor: ORANGE_SOFT,
    borderColor: ORANGE,
  },
  chipText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: TEXT_2,
  },
  chipTextActive: {
    color: ORANGE,
  },
  infoBar: {
    backgroundColor: BLUE_SOFT,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 16,
  },
  infoText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: BLUE,
    lineHeight: 18,
  },
  errorBar: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 18,
  },
  sendBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sendBtnDisabled: {
    backgroundColor: DISABLED_BG,
  },
  sendBtnText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
});
