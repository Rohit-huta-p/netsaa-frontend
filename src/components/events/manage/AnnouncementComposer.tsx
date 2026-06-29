// src/components/events/manage/AnnouncementComposer.tsx
//
// Bottom-sheet Modal for organizers to send push/email/SMS announcements to a
// chosen audience subset. Styled to match the O6 mockup exactly
// (event-flow-mockups-organizer.html · O6): #0E0C12 sheet, mono labels,
// rounded-rect chips with a white-fill active state, white CTA with dark ink.
//
// Props:
//   visible · eventId · onClose (no-op on 429) · onSent (after success)
//
// Honest deviations from the mockup (we don't have the data, so we don't fake
// it): audience chips carry no "· 22" counts; the info line is generic (no live
// recipient count / daily-quota); no "Tone: warm host" hint. Dismiss is via the
// grab handle + tapping the backdrop (the mockup has no explicit close button).
//
// Behaviour: body ≤300 chars; Push default ON, ≥1 channel required; audience
// single-select (Confirmed default — safer than All). Send disabled while
// sending / body empty / no channel. 429 → inline server message, don't close.

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
import { Bell, Mail, MessageSquare, Info } from 'lucide-react-native';
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

const BODY_MAX = 300;

const CHANNEL_META: { key: Channel; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'push', label: 'Push', Icon: Bell },
  { key: 'email', label: 'Email', Icon: Mail },
  { key: 'sms', label: 'SMS', Icon: MessageSquare },
];

const AUDIENCE_META: { key: Audience; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'waitlisted', label: 'Waitlist' },
  { key: 'vip', label: 'VIP' },
];

// ----------------------------------------------------------------- palette (mockup tokens)

const BACKDROP = 'rgba(0,0,0,0.55)';
const SHEET_BG = '#0E0C12';                 // --bg-2
const SURFACE = 'rgba(255,255,255,0.04)';   // --surface
const HAIRLINE_2 = 'rgba(255,255,255,0.10)';// --hairline-2
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';                   // --text-1
const TEXT_2 = '#71717A';                   // --text-2
const TEXT_3 = '#52525B';                   // --text-3
const ORANGE_INK = '#1A0D06';               // --orange-ink (text on white)
const BLUE = '#5B8DEF';
const BLUE_SOFT = 'rgba(91,141,239,0.14)';  // --blue-soft
const RED = '#EF4444';

// ----------------------------------------------------------------- component

export default function AnnouncementComposer({ visible, eventId, onClose, onSent }: Props) {
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<Set<Channel>>(new Set(['push']));
  const [audience, setAudience] = useState<Audience>('confirmed');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleChannel = useCallback((ch: Channel) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        if (next.size === 1) return prev; // keep ≥1
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
      setBody('');
      setChannels(new Set(['push']));
      setAudience('confirmed');
      onSent?.();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.meta?.message || err?.response?.data?.message;
      if (err?.response?.status === 429 && serverMsg) {
        setErrorMsg(serverMsg);
      } else {
        setErrorMsg(serverMsg || 'Failed to send announcement. Please try again.');
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss announcement composer" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.grab} />

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Header */}
            <Text style={styles.title}>New announcement</Text>
            <Text style={styles.lead}>Goes out to the audience you pick below.</Text>

            {/* Message */}
            <Text style={styles.label}>Message</Text>
            <View style={styles.textareaWrap}>
              <TextInput
                style={styles.textarea}
                value={body}
                onChangeText={(t) => { if (t.length <= BODY_MAX) setBody(t); }}
                placeholder="Write your announcement…"
                placeholderTextColor={TEXT_3}
                multiline
                maxLength={BODY_MAX}
                accessibilityLabel="Announcement message"
              />
              <Text style={styles.charCount}>{body.length} / {BODY_MAX}</Text>
            </View>

            {/* Channels */}
            <Text style={styles.label}>Channels</Text>
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
                    <Icon size={13} color={active ? ORANGE_INK : TEXT_2} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Audience */}
            <Text style={styles.label}>Audience</Text>
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
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info / error */}
            {errorMsg ? (
              <View style={styles.errorBar}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : (
              <View style={styles.infoBar}>
                <Info size={16} color={BLUE} style={{ marginTop: 1 }} />
                <Text style={styles.infoText}>
                  Your {audienceLabel.toLowerCase()} attendees will receive this via {channelList}.
                </Text>
              </View>
            )}

            {/* Send */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Send announcement"
              accessibilityState={{ disabled: !canSend }}
            >
              {sending ? (
                <ActivityIndicator size="small" color={ORANGE_INK} />
              ) : (
                <Text style={[styles.sendBtnText, !canSend && styles.sendBtnTextDisabled]}>Send →</Text>
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: BACKDROP },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: HAIRLINE_2,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    maxHeight: '92%',
  },
  grab: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: 99,
    backgroundColor: TEXT_3,
    marginTop: 8,
    marginBottom: 12,
  },
  body: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 8 },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    lineHeight: 23,
    color: TEXT_0,
    marginBottom: 4,
  },
  lead: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_1,
    marginBottom: 16,
  },
  label: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: TEXT_3,
    marginBottom: 8,
  },
  textareaWrap: {
    backgroundColor: SURFACE,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: HAIRLINE_2,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 8,
    marginBottom: 18,
  },
  textarea: {
    color: TEXT_0,
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  } as any,
  charCount: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10.5,
    color: TEXT_3,
    textAlign: 'right',
    marginTop: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: HAIRLINE_2,
    backgroundColor: SURFACE,
  },
  chipActive: { backgroundColor: TEXT_0, borderColor: TEXT_0 },
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 12, color: TEXT_1 },
  chipTextActive: { fontFamily: 'Outfit-SemiBold', color: ORANGE_INK },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: BLUE_SOFT,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 14,
  },
  infoText: { flex: 1, fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_1, lineHeight: 18 },
  errorBar: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontFamily: 'Outfit-Regular', fontSize: 12, color: RED, lineHeight: 18 },
  sendBtn: {
    height: 48,
    borderRadius: 11,
    backgroundColor: TEXT_0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  sendBtnText: { fontFamily: 'Outfit-Bold', fontSize: 13.5, color: ORANGE_INK, letterSpacing: 0.2 },
  sendBtnTextDisabled: { color: TEXT_3 },
});
