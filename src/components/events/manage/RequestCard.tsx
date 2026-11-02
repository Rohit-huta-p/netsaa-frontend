/**
 * RequestCard — one registration request on the host Requests surface
 * (event-manage-aminimal.html · frame 11). The events sibling of the gig hub's
 * crisp HubApplicantRow: name-led, pill-free, answers/application shown inline,
 * small right-aligned per-state actions.
 *
 *   pending  → Decline · Approve   (Decline expands an optional-reason row)
 *   approved → read-only "Awaiting payment" tag (a paid request holding its seat
 *              while the attendee pays within 48h — no host action exists yet)
 *
 * A·Minimal tokens (canvas #121216 / card #1C1C23 / well #212129). Pay-as-fact:
 * money is never a hero here — an approved paid hold reads as a plain status.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking } from 'react-native';
import { Check, X, Clock, ExternalLink } from 'lucide-react-native';
import type { EventRosterRow } from '@/services/eventService';
import {
  initialsOf, tintFor, requestMetaLine, visibleAnswers,
} from './requestFormat';

const C = {
  card: '#1C1C23',
  well: '#212129',
  hairline: 'rgba(255,255,255,0.08)',
  cream: '#F3EFE8',
  text2: '#C9C6CF',
  text3: '#9C99A6',
  text4: '#6E6C76',
  orange: '#FF6B35',
  orangeTint: '#FFCBB2',
  gold: '#F0B65A',
  red: '#F0858A',
  redLine: 'rgba(240,101,107,0.32)',
  onOrange: '#160A04',
};

type SpotLite = { _id?: string; name?: string };

type Props = {
  row: EventRosterRow;
  spots?: SpotLite[];
  mode: 'pending' | 'approved';
  busy?: boolean;
  onApprove?: (registrationId: string) => void;
  onDecline?: (registrationId: string, reason?: string) => void;
};

/** Friendly label + opener for an application link (Instagram / YouTube / domain). */
function linkLabel(url: string): string {
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
    const map: Record<string, string> = {
      'instagram.com': 'Instagram', 'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
      'vimeo.com': 'Vimeo', 'drive.google.com': 'Drive', 'soundcloud.com': 'SoundCloud',
      'spotify.com': 'Spotify', 'open.spotify.com': 'Spotify',
    };
    return map[host] ?? host;
  } catch {
    return 'Link';
  }
}

export default function RequestCard({ row, spots, mode, busy, onApprove, onDecline }: Props) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');

  const name = (row.name ?? '').trim() || 'Guest';
  const meta = requestMetaLine(row, spots);
  const answers = visibleAnswers(row);
  const pitch = (row.application?.pitch ?? '').trim();
  const links = (row.application?.links ?? []).filter((l) => !!l && l.trim());
  const phone = (row.phone ?? '').trim();

  const confirmDecline = () => {
    onDecline?.(row._id, reason.trim() || undefined);
    setDeclining(false);
    setReason('');
  };

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.hairline,
        backgroundColor: C.card,
        padding: 15,
        marginBottom: 12,
      }}
      accessibilityLabel={`Request from ${name}`}
    >
      {/* header: avatar · name + meta */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View
          style={{
            width: 44, height: 44, borderRadius: 13,
            backgroundColor: tintFor(name),
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 15, color: '#FFFFFF' }}>{initialsOf(name)}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: 'Outfit-Bold', fontSize: 15.5, color: C.cream, letterSpacing: -0.2 }}>
            {name}
          </Text>
          {meta ? (
            <Text numberOfLines={1} style={{ fontFamily: 'Outfit-Regular', fontSize: 11.5, color: C.text4, marginTop: 3 }}>
              {meta}
            </Text>
          ) : null}
          {phone ? (
            <Text numberOfLines={1} style={{ fontFamily: 'SpaceMono-Regular', fontSize: 10.5, color: C.text3, marginTop: 4 }}>
              {phone}
            </Text>
          ) : null}
        </View>

        {mode === 'approved' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <Clock size={11} color={C.gold} strokeWidth={2} />
            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 0.8, color: C.gold, textTransform: 'uppercase' }}>
              Awaiting pay
            </Text>
          </View>
        ) : null}
      </View>

      {/* answers to the host's custom questions */}
      {answers.length > 0 ? (
        <View style={{ backgroundColor: C.well, borderRadius: 11, padding: 12, marginTop: 12, gap: 8 }}>
          {answers.map((line, i) => (
            <Text key={i} style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: C.text2, lineHeight: 17 }}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {/* apply-with-work pitch */}
      {pitch ? (
        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: C.text2, lineHeight: 18, marginTop: 11 }}>
          <Text style={{ color: C.orangeTint }}>“</Text>
          {pitch}
          <Text style={{ color: C.orangeTint }}>”</Text>
        </Text>
      ) : null}

      {/* apply-with-work links */}
      {links.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
          {links.map((url, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => Linking.openURL(url.startsWith('http') ? url : `https://${url}`)}
              accessibilityRole="link"
              accessibilityLabel={`Open ${linkLabel(url)}`}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                borderWidth: 1, borderColor: C.hairline, borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 6,
              }}
            >
              <ExternalLink size={12} color={C.text3} strokeWidth={1.8} />
              <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 11.5, color: C.text2 }}>{linkLabel(url)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* footer */}
      {mode === 'pending' ? (
        declining ? (
          <View style={{ marginTop: 13 }}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (optional) — shared with the applicant"
              placeholderTextColor={C.text4}
              style={{
                borderWidth: 1, borderColor: C.hairline, borderRadius: 9,
                backgroundColor: C.well, color: C.cream,
                fontFamily: 'Outfit-Regular', fontSize: 13,
                paddingHorizontal: 12, paddingVertical: 9,
              }}
              editable={!busy}
              multiline
              accessibilityLabel="Decline reason, optional"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <GhostBtn label="Back" tint={C.text2} border={C.hairline} disabled={busy} onPress={() => { setDeclining(false); setReason(''); }} accessibilityLabel={`Cancel declining ${name}`} />
              <GhostBtn label="Confirm decline" tint={C.red} border={C.redLine} icon={X} disabled={busy} onPress={confirmDecline} accessibilityLabel={`Confirm decline ${name}`} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, justifyContent: 'flex-end' }}>
            <GhostBtn label="Decline" tint={C.text2} border={C.hairline} disabled={busy} onPress={() => setDeclining(true)} accessibilityLabel={`Decline ${name}`} />
            <PrimaryBtn label="Approve" icon={Check} disabled={busy} onPress={() => onApprove?.(row._id)} accessibilityLabel={`Approve ${name}`} />
          </View>
        )
      ) : null}
    </View>
  );
}

function PrimaryBtn({ label, icon: Icon, onPress, disabled, accessibilityLabel }: { label: string; icon?: any; onPress: () => void; disabled?: boolean; accessibilityLabel: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={{
        height: 34, paddingHorizontal: 15, borderRadius: 9,
        backgroundColor: C.orange, opacity: disabled ? 0.5 : 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {Icon ? <Icon size={14} color={C.onOrange} strokeWidth={2.4} /> : null}
      <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 12, color: C.onOrange, letterSpacing: 0.2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function GhostBtn({ label, tint, border, icon: Icon, onPress, disabled, accessibilityLabel }: { label: string; tint: string; border: string; icon?: any; onPress: () => void; disabled?: boolean; accessibilityLabel: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={{
        height: 34, paddingHorizontal: 14, borderRadius: 9,
        borderWidth: 1, borderColor: border, backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {Icon ? <Icon size={13} color={tint} strokeWidth={2} /> : null}
      <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 12, color: tint }}>{label}</Text>
    </TouchableOpacity>
  );
}
