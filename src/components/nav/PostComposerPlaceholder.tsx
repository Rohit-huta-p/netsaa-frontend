// netsa-mobile/src/components/nav/PostComposerPlaceholder.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PostComposerPlaceholder({ visible, onClose }: Props) {
  const router = useRouter();

  const choose = (type: 'gig' | 'event') => {
    onClose();
    // Route to existing unified /create composer with the correct tab preselected.
    // The placeholder filenames (post-gig/post-event) don't exist yet — create.tsx
    // already handles both in a single screen via ?initialTab=.
    router.push(`/(app)/create?initialTab=${type}` as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#F5F0EB" />
          </TouchableOpacity>
          <Text style={styles.title}>What are you posting?</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.choice} onPress={() => choose('gig')}>
              <Text style={styles.choiceEmoji}>🎤</Text>
              <Text style={styles.choiceLabel}>Gig</Text>
              <Text style={styles.choiceSub}>A paid performance opportunity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.choice} onPress={() => choose('event')}>
              <Text style={styles.choiceEmoji}>🎭</Text>
              <Text style={styles.choiceLabel}>Event</Text>
              <Text style={styles.choiceSub}>Workshop, audition, meetup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0A0A0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245, 240, 235, 0.3)',
    marginBottom: 16,
  },
  closeBtn: { position: 'absolute', top: 20, right: 20, padding: 6 },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: '#F5F0EB',
    marginBottom: 20,
  },
  grid: { flexDirection: 'row', gap: 12 },
  choice: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  choiceEmoji: { fontSize: 28, marginBottom: 10 },
  choiceLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#F5F0EB',
    marginBottom: 4,
  },
  choiceSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: 'rgba(245, 240, 235, 0.6)',
    lineHeight: 16,
  },
});
