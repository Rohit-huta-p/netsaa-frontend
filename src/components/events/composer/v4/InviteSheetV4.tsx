/**
 * Invite sheet (spec frame 01b). Opens from a plain-name "featuring" chip in
 * Step 1 that isn't on NETSA yet. The host picks a channel; NETSA sends nothing
 * itself. After any share, the person is marked "Invited" (onShared).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Linking, Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MessageCircle, MessageSquare, Link2, X } from 'lucide-react-native';
import { C, F } from './theme';
import type { PersonV4 } from './composerForm';
import {
  INVITE_LINK, inviteFirstName, buildInviteMessage,
  whatsappAppUrl, whatsappWebUrl, smsUrl,
} from './invite';

export default function InviteSheetV4({ person, onClose, onShared }: {
  person: PersonV4 | null;
  onClose: () => void;
  onShared: () => void;           // mark this person invited
}) {
  const [copied, setCopied] = useState(false);
  const first = inviteFirstName(person?.displayName || '');
  const message = buildInviteMessage(first);

  const whatsapp = async () => {
    const app = whatsappAppUrl(message);
    const ok = await Linking.canOpenURL(app).catch(() => false);
    try {
      if (ok) await Linking.openURL(app);
      else await Linking.openURL(whatsappWebUrl(message));
    } catch {
      await Share.share({ message }).catch(() => {});
    }
    onShared();
    onClose();
  };

  const sms = async () => {
    try {
      await Linking.openURL(smsUrl(Platform.OS === 'ios', message));
    } catch {
      await Share.share({ message }).catch(() => {});
    }
    onShared();
    onClose();
  };

  const copy = async () => {
    await Clipboard.setStringAsync(INVITE_LINK);
    setCopied(true);
    onShared();                     // sharing the link = invited
    setTimeout(() => setCopied(false), 1800);
  };

  const close = () => { setCopied(false); onClose(); };

  return (
    <Modal visible={!!person} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={st.backdrop} onPress={close}>
        <Pressable style={st.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={st.grabber} />

          <View style={st.head}>
            <View style={{ flex: 1 }}>
              <Text style={st.title}>Invite {first}</Text>
              <Text style={st.sub}>Not on NETSA yet</Text>
            </View>
            <Pressable onPress={close} hitSlop={10} style={st.close} accessibilityLabel="Close">
              <X size={18} color={C.dim} />
            </Pressable>
          </View>

          <Row icon={<MessageCircle size={20} color="#25D366" />} tint="rgba(37,211,102,0.16)"
            label="Send on WhatsApp" sub="Pick the contact — the message is ready" onPress={whatsapp} />
          <Row icon={<MessageSquare size={20} color="#60A5FA" />} tint="rgba(96,165,250,0.16)"
            label="Send as SMS" sub="Opens Messages with the text filled in" onPress={sms} />
          <Row icon={<Link2 size={20} color={C.orange} />} tint={C.orangeSoft}
            label={copied ? 'Link copied' : 'Copy invite link'} sub="Paste it anywhere — even an Instagram DM" onPress={copy} />

          <Text style={st.note}>
            NETSA doesn’t send anything itself. Pick the contact in WhatsApp or Messages, or copy the
            link and paste it anywhere. After you share it, {first} shows as “Invited”.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ icon, tint, label, sub, onPress }: {
  icon: React.ReactNode; tint: string; label: string; sub: string; onPress: () => void;
}) {
  return (
    <Pressable style={st.row} onPress={onPress}>
      <View style={[st.rowIc, { backgroundColor: tint }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={st.rowLabel}>{label}</Text>
        <Text style={st.rowSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card2, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, borderTopWidth: 1, borderColor: C.border2 },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: C.border2, marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  title: { fontFamily: F.serif, fontSize: 23, color: C.t1, letterSpacing: -0.4 },
  sub: { fontFamily: F.body, fontSize: 12.5, color: C.dim, marginTop: 3 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.well, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10 },
  rowIc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: F.semibold, fontSize: 14.5, color: C.t2 },
  rowSub: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 2 },
  note: { fontFamily: F.body, fontSize: 11.5, color: C.dim2, lineHeight: 17, marginTop: 6 },
});
