/**
 * Leave-the-composer confirmation — the "safe by default" sheet (layout 1).
 *
 * create mode: the draft is auto-saved the instant the host backs out, so the
 * sheet opens, saves in the background, and confirms with a green "Draft saved"
 * pill. Leaving is then a no-op (already saved); Discard DELETES the draft.
 *
 * edit mode: no auto-save (editing a LIVE event) — "Save & leave" PATCHes on tap.
 *
 * Palette stays quiet: primary uses the orange TINT (solid orange is the Publish
 * CTA), discard is a dusty-rose link.
 */
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, Check, RotateCcw, AlertTriangle } from 'lucide-react-native';
import { C, F } from './theme';

const ROSE = '#D7A49A';     // muted destructive
const ROSE_DIM = '#8F7A75';
const GREEN = '#86EFAC';

export type LeaveMode = 'create' | 'edit';
export type DraftSaveState = 'saving' | 'saved' | 'error';

export default function LeaveComposerSheet({
  visible, mode, saveState = 'saving', editSaving = false,
  onPrimary, onRetry, onKeepEditing, onDiscard,
}: {
  visible: boolean;
  mode: LeaveMode;
  saveState?: DraftSaveState;   // create only
  editSaving?: boolean;         // edit only — PATCH in flight
  onPrimary: () => void;        // create: leave now · edit: save & leave
  onRetry?: () => void;         // create + error
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isCreate = mode === 'create';
  const busy = isCreate ? saveState === 'saving' : editSaving;

  // ---- copy ----
  const title = !isCreate
    ? 'Save your changes?'
    : saveState === 'error' ? 'We couldn’t save your draft.' : 'Your progress is safe.';
  const body = !isCreate
    ? "You've made changes to this event. Keep them, or throw them away."
    : saveState === 'error'
      ? 'Something went wrong — your changes are still here. Try again.'
      : 'We kept this event in your drafts — pick it back up any time.';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={busy ? undefined : onKeepEditing}>
      <View style={st.fill}>
        <Pressable style={st.scrim} onPress={busy ? undefined : onKeepEditing} accessibilityLabel="Keep editing" />
        <View style={[st.sheet, { paddingBottom: 16 + Math.max(insets.bottom, 6) }]}>
          <View style={st.grab} />

          {/* create-mode save pill */}
          {isCreate ? <SavePill state={saveState} /> : null}

          <Text style={st.title}>{title}</Text>
          <Text style={st.body}>{body}</Text>

          {/* PRIMARY */}
          {isCreate && saveState === 'error' ? (
            <Pressable onPress={onRetry} style={({ pressed }) => [st.primary, pressed && st.pressed]} accessibilityRole="button" accessibilityLabel="Try again">
              <View style={st.pIcon}><RotateCcw size={18} color={C.orangeInk} /></View>
              <View style={st.pText}><Text style={st.pLabel}>Try again</Text></View>
            </Pressable>
          ) : (
            <Pressable
              onPress={isCreate ? onPrimary : (editSaving ? undefined : onPrimary)}
              disabled={!isCreate && editSaving}
              style={({ pressed }) => [st.primary, pressed && !busy && st.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isCreate ? 'Leave for now' : 'Save and leave'}
            >
              <View style={st.pIcon}>
                {!isCreate && editSaving
                  ? <ActivityIndicator size="small" color={C.orangeInk} />
                  : (isCreate ? <LogOut size={19} color={C.orangeInk} /> : <Check size={19} color={C.orangeInk} />)}
              </View>
              <View style={st.pText}>
                <Text style={st.pLabel}>{isCreate ? 'Leave for now' : (editSaving ? 'Saving…' : 'Save & leave')}</Text>
                {isCreate ? <Text style={st.pSub}>Find it under Drafts when you’re back.</Text>
                  : (!editSaving ? <Text style={st.pSub}>Your changes are kept.</Text> : null)}
              </View>
            </Pressable>
          )}

          {/* KEEP EDITING */}
          <Pressable
            onPress={busy ? undefined : onKeepEditing}
            disabled={busy}
            style={({ pressed }) => [st.ghost, pressed && !busy && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Keep editing"
          >
            <Text style={st.ghostLabel}>Keep editing</Text>
          </Pressable>

          {/* DISCARD — demoted link. Disabled mid-save so we never orphan an in-flight draft. */}
          <Pressable
            onPress={isCreate && saveState === 'saving' ? undefined : onDiscard}
            disabled={isCreate && saveState === 'saving'}
            hitSlop={6}
            style={({ pressed }) => [st.link, pressed && st.linkPressed, (isCreate && saveState === 'saving') && { opacity: 0.4 }]}
            accessibilityRole="button"
            accessibilityLabel={isCreate ? 'Discard this draft' : 'Discard changes'}
          >
            <Text style={st.linkLabel}>{isCreate ? 'Discard this draft instead' : 'Discard changes'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SavePill({ state }: { state: DraftSaveState }) {
  if (state === 'saving') {
    return (
      <View style={[st.pill, st.pillNeutral]}>
        <ActivityIndicator size="small" color={C.dim} />
        <Text style={[st.pillTxt, { color: C.dim }]}>Saving your draft…</Text>
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View style={[st.pill, st.pillError]}>
        <AlertTriangle size={13} color={ROSE} />
        <Text style={[st.pillTxt, { color: ROSE }]}>Couldn’t save</Text>
      </View>
    );
  }
  return (
    <View style={[st.pill, st.pillOk]}>
      <Check size={13} color={GREEN} />
      <Text style={[st.pillTxt, { color: GREEN }]}>Draft saved</Text>
    </View>
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

  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 11, marginBottom: 12, marginLeft: 2 },
  pillTxt: { fontFamily: F.bold, fontSize: 11.5 },
  pillOk: { backgroundColor: 'rgba(134,239,172,0.09)', borderColor: 'rgba(134,239,172,0.22)' },
  pillNeutral: { backgroundColor: '#141418', borderColor: C.border2 },
  pillError: { backgroundColor: 'rgba(240,110,95,0.09)', borderColor: 'rgba(240,110,95,0.26)' },

  title: { fontFamily: F.serif, fontSize: 21, color: '#fff', letterSpacing: -0.3, marginHorizontal: 2 },
  body: { fontFamily: F.body, fontSize: 13, color: C.dim, lineHeight: 19, marginTop: 6, marginHorizontal: 2, marginBottom: 17 },

  primary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.orangeSoft, borderWidth: 1, borderColor: C.orangeBorder,
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, minHeight: 56,
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
  linkPressed: { opacity: 0.6 },
  linkLabel: { fontFamily: F.semibold, fontSize: 12.5, color: ROSE, letterSpacing: 0.1 },

  pressed: { opacity: 0.85 },
});
