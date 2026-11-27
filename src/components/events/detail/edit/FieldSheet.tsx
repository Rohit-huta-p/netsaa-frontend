/**
 * FieldSheet — the reusable focused bottom-sheet behind the host "Edit in Preview"
 * zone (P2/P3). A slide-up Modal (the InviteSheetV4 pattern) that hosts one field's
 * composer inputs; the body mutates the shared composer store live and the host zone
 * commits through useEventEdit's debounced save on change + on close.
 *
 * The content is the caller's — each sheet reuses the composer v4 `ui/*` primitives
 * (the behaviour source of truth) so "edit" and "create" show the same inputs.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { C, F } from '../../composer/v4/theme';

export default function FieldSheet({
  visible, title, sub, onClose, children, scroll = true,
}: {
  visible: boolean;
  title: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Wrap the body in a ScrollView (default). Pass false for a short sheet whose
   *  input needs an overflowing overlay (e.g. an anchored dropdown). */
  scroll?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={st.grabber} />
          <View style={st.head}>
            <View style={{ flex: 1 }}>
              <Text style={st.title}>{title}</Text>
              {sub ? <Text style={st.sub}>{sub}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={st.close} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={C.dim} />
            </Pressable>
          </View>
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={st.bodyContent}
              style={st.body}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[st.body, st.bodyContent]}>{children}</View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.card2, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderColor: C.border2,
    maxHeight: '86%',
  },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: C.border2, marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, gap: 12 },
  title: { fontFamily: F.serif, fontSize: 23, color: C.t1, letterSpacing: -0.4 },
  sub: { fontFamily: F.body, fontSize: 12.5, color: C.dim, marginTop: 3, lineHeight: 17 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.well, alignItems: 'center', justifyContent: 'center' },
  body: { },
  bodyContent: { paddingBottom: 34 },
});
