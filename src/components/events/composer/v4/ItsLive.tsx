import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, MessageCircle, Link2, Share2, Users, ArrowUpRight } from 'lucide-react-native';
import { C, F } from './theme';
import type { PersonV4 } from './composerForm';

const SITE = 'https://netsaa.com';

export default function ItsLive({ eventId, status, title, pendingInvites, onDone, onViewEvent }: {
  eventId: string; status: string; title: string; pendingInvites: PersonV4[];
  onDone: () => void; onViewEvent: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE}/events/${eventId}`;
  const live = status === 'live';
  const msg = `${title}\n${url}`;

  const whatsapp = async () => {
    const wa = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const ok = await Linking.canOpenURL(wa).catch(() => false);
    if (ok) Linking.openURL(wa); else Share.share({ message: msg });
  };
  const copy = async () => { await Clipboard.setStringAsync(url); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const share = () => Share.share(Platform.OS === 'ios' ? { message: title, url } : { message: msg });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
      <View style={[st.badge, !live && st.badgeReview]}>
        <Check size={30} color={live ? C.green : C.orange} strokeWidth={2.6} />
      </View>
      <Text style={st.eyebrow}>{live ? 'IT’S LIVE' : 'IN REVIEW'}</Text>
      <Text style={st.title}>{title}</Text>
      <Text style={st.lede}>
        {live
          ? 'Your event is up. Share it where your people already are.'
          : 'First events get a quick look before they go public — usually within a day. We’ll let you know the moment it’s live, and you can share the link now.'}
      </Text>

      <Text style={st.section}>SHARE IT</Text>
      <View style={st.shareRow}>
        <Pressable style={st.shareBtn} onPress={whatsapp}>
          <View style={[st.shareIc, { backgroundColor: 'rgba(37,211,102,0.16)' }]}><MessageCircle size={19} color="#25D366" /></View>
          <Text style={st.shareTxt}>WhatsApp</Text>
        </Pressable>
        <Pressable style={st.shareBtn} onPress={copy}>
          <View style={[st.shareIc, { backgroundColor: C.orangeSoft }]}><Link2 size={19} color={C.orange} /></View>
          <Text style={st.shareTxt}>{copied ? 'Copied!' : 'Copy link'}</Text>
        </Pressable>
        <Pressable style={st.shareBtn} onPress={share}>
          <View style={[st.shareIc, { backgroundColor: C.well }]}><Share2 size={19} color={C.t2} /></View>
          <Text style={st.shareTxt}>More</Text>
        </Pressable>
      </View>
      <Pressable style={st.linkRow} onPress={copy}>
        <Text style={st.linkTxt} numberOfLines={1}>{url}</Text>
        <Text style={st.linkCopy}>{copied ? 'Copied' : 'Copy'}</Text>
      </Pressable>

      {pendingInvites.length ? (
        <View style={st.team}>
          <View style={st.teamIc}><Users size={16} color={C.orange} /></View>
          <View style={{ flex: 1 }}>
            <Text style={st.teamTitle}>{pendingInvites.length} {pendingInvites.length === 1 ? 'invite' : 'invites'} still pending</Text>
            <Text style={st.teamSub}>{pendingInvites.map((p) => p.displayName).join(', ')} — send them the link so the event credits them.</Text>
          </View>
        </View>
      ) : null}

      <View style={st.actions}>
        <Pressable style={st.primary} onPress={onViewEvent}>
          <Text style={st.primaryTxt}>View event</Text><ArrowUpRight size={17} color="#fff" strokeWidth={2.4} />
        </Pressable>
        <Pressable style={st.ghost} onPress={onDone}><Text style={st.ghostTxt}>Done</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 48, alignItems: 'center' },
  badge: { width: 74, height: 74, borderRadius: 37, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  badgeReview: { backgroundColor: C.orangeSoft },
  eyebrow: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.dim, marginBottom: 8 },
  title: { fontFamily: F.serif, fontSize: 28, color: C.t1, letterSpacing: -0.5, textAlign: 'center', lineHeight: 33 },
  lede: { fontFamily: F.body, fontSize: 13.5, color: C.dim, textAlign: 'center', lineHeight: 20, marginTop: 12, marginBottom: 34, maxWidth: 320 },
  section: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.4, color: C.dim, alignSelf: 'stretch', marginBottom: 12 },
  shareRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  shareBtn: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 15, alignItems: 'center', gap: 9 },
  shareIc: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  shareTxt: { fontFamily: F.semibold, fontSize: 11.5, color: C.t2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', backgroundColor: C.well, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 12, marginTop: 12 },
  linkTxt: { flex: 1, fontFamily: F.mono, fontSize: 11.5, color: C.dim },
  linkCopy: { fontFamily: F.labelHeavy, fontSize: 11, color: C.orange, letterSpacing: 0.3 },
  team: { flexDirection: 'row', gap: 11, alignSelf: 'stretch', backgroundColor: C.card, borderWidth: 1, borderColor: C.orangeBorder, borderRadius: 13, padding: 13, marginTop: 20 },
  teamIc: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  teamTitle: { fontFamily: F.bold, fontSize: 13, color: C.t2 },
  teamSub: { fontFamily: F.body, fontSize: 11.5, color: C.dim, lineHeight: 16, marginTop: 2 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 36 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.orange, borderRadius: 14, height: 52 },
  primaryTxt: { fontFamily: F.labelHeavy, fontSize: 15, color: '#fff' },
  ghost: { alignItems: 'center', justifyContent: 'center', height: 44 },
  ghostTxt: { fontFamily: F.semibold, fontSize: 14, color: C.dim },
});
