/**
 * Leave-the-composer confirmation — the "safe by default" sheet (layout 1).
 *
 * Shown only when the host taps the close gesture with a DIRTY form. The whole
 * idea: leaving should never lose work, so the safe path (keep the draft) is the
 * primary action and discard is demoted to a quiet text link that takes intent.
 *
 *   create mode → "Leave for now" saves the event as a draft, then leaves.
 *   edit mode   → "Save & leave" PATCHes the open event, then leaves.
 *
 * Palette is deliberately quiet: the primary uses the orange TINT (not solid
 * orange, which is reserved for the composer's Publish CTA), and discard is a
 * dusty-rose link, so nothing shouts.
 */
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, Check } from 'lucide-react-native';
import { C, F } from './theme';

const ROSE = '#D7A49A';     // muted destructive — not the brighter theme red
const ROSE_DIM = '#8F7A75'; // discard sublabel

export type LeaveMode = 'create' | 'edit';

export default function LeaveComposerSheet({
  visible, mode, saving, onLeaveSave, onKeepEditing, onDiscard,
}: {
  visible: boolean;
  mode: LeaveMode;
  saving: boolean;
  onLeaveSave: () => void;   // create → save draft; edit → save changes
  onKeepEditing: () => void; // dismiss, stay put
  onDiscard: () => void;     // throw the work away and leave
}) {
  const insets = useSafeAreaInsets();
  const isCreate = mode === 'create';

  const title = isCreate ? 'Your progress is safe.' : 'Save your changes?';
  const body = isCreate
    ? "We'll keep this event in your drafts — pick it back up any time."
    : "You've made changes to this event. Keep them, or throw them away.";
  const primaryLabel = isCreate ? 'Leave for now' : 'Save & leave';
  const primarySub = isCreate ? 'Find it under Drafts when you’re back.' : 'Your changes are kept.';
  const discardLabel = isCreate ? 'Discard this draft instead' : 'Discard changes';
  const PrimaryIcon = isCreate ? LogOut : Check;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={saving ? undefined : onKeepEditing}>
      <View style={st.fill}>
        <Pressable style={st.scrim} onPress={saving ? undefined : onKeepEditing} accessibilityLabel="Keep editing" />
        <View style={[st.sheet, { paddingBottom: 16 + Math.max(insets.bottom, 6) }]}>
          <View style={st.grab} />

          <Text style={st.title}>{title}</Text>
          <Text style={st.body}>{body}</Text>

          {/* Primary — keep the work. Orange TINT, never solid. */}
          <Pressable
            onPress={saving ? undefined : onLeaveSave}
            disabled={saving}
            style={({ pressed }) => [st.primary, pressed && !saving && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
          >
            <View style={st.pIcon}>
              {saving ? <ActivityIndicator size="small" color={C.orangeInk} /> : <PrimaryIcon size={19} color={C.orangeInk} />}
            </View>
            <View style={st.pText}>
              <Text style={st.pLabel}>{saving ? 'Saving…' : primaryLabel}</Text>
              {!saving ? <Text style={st.pSub}>{primarySub}</Text> : null}
            </View>
          </Pressable>

          {/* Keep editing — quiet ghost. */}
          <Pressable
            onPress={saving ? undefined : onKeepEditing}
            disabled={saving}
            style={({ pressed }) => [st.ghost, pressed && !saving && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Keep editing"
          >
            <Text style={st.ghostLabel}>Keep editing</Text>
          </Pressable>

          {/* Discard — demoted text link, dusty rose. */}
          <Pressable
            onPress={saving ? undefined : onDiscard}
            disabled={saving}
            hitSlop={6}
            style={({ pressed }) => [st.link, pressed && !saving && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={discardLabel}
          >
            <Text style={st.linkLabel}>{discardLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,2,4,0.66)' },
  sheet: {
    backgroundColor: C.sheet,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18, paddingTop: 10,
  },
  grab: { width: 38, height: 4, borderRadius: 999, backgroundColor: '#2B2B33', alignSelf: 'center', marginTop: 2, marginBottom: 14 },

  title: { fontFamily: F.serif, fontSize: 21, color: '#fff', letterSpacing: -0.3, marginHorizontal: 2 },
  body: { fontFamily: F.body, fontSize: 13, color: C.dim, lineHeight: 19, marginTop: 6, marginHorizontal: 2, marginBottom: 17 },

  primary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.orangeSoft, borderWidth: 1, borderColor: C.orangeBorder,
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15,
  },
  pIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  pText: { flex: 1, minWidth: 0 },
  pLabel: { fontFamily: F.bold, fontSize: 15, color: C.orangeInk, letterSpacing: -0.1 },
  pSub: { fontFamily: F.body, fontSize: 11.5, color: '#A8938A', marginTop: 2 },

  ghost: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border2, borderRadius: 14,
    paddingVertical: 15, marginTop: 9,
  },
  ghostLabel: { fontFamily: F.bold, fontSize: 15, color: C.t3 },

  link: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 10 },
  linkLabel: { fontFamily: F.semibold, fontSize: 12.5, color: ROSE, letterSpacing: 0.1 },

  pressed: { opacity: 0.85 },
});
