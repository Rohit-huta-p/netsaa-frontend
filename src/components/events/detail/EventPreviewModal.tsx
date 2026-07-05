/**
 * EventPreviewModal — "Preview as a viewer" for the organizer, as a page-sheet
 * modal over the manage screen (chosen style B).
 *
 * iOS: `presentationStyle="pageSheet"` gives the card that stops short of the
 * top (a dimmed peek of manage stays behind) with native swipe-down-to-dismiss.
 * Android: RN ignores presentationStyle → full-screen; the grab handle +
 * hero back-chevron + hardware back all dismiss it. Content is the exact artist
 * viewer (EventDetailViewer in `preview` mode) — no "preview" banner.
 *
 * Mounts the viewer only while visible so its queries don't run in the closed
 * state.
 */
import { Modal, View, StyleSheet } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import EventDetailViewer from './EventDetailViewer';

const BG = '#0B0A0F'; // v2 bg-1

interface Props {
  event: EventDoc;
  visible: boolean;
  onClose(): void;
}

export default function EventPreviewModal({ event, visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Grab handle — the drag/dismiss affordance (and a visual cue on Android) */}
        <View style={styles.grabWrap}>
          <View style={styles.grab} />
        </View>
        {visible ? <EventDetailViewer event={event} preview onClose={onClose} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  grabWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 2, backgroundColor: BG },
  grab: { width: 38, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)' },
});
