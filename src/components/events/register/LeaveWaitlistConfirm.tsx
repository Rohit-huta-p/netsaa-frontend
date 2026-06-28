import React from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLeaveWaitlist } from '@/hooks/useEvents';

const BG = '#09090b';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE_2 = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';

interface Props {
  visible: boolean;
  eventId: string;
  position: number;
  onClose: () => void;
  onLeft: () => void;
}

export default function LeaveWaitlistConfirm({
  visible,
  eventId,
  position,
  onClose,
  onLeft,
}: Props) {
  const { mutateAsync: leaveWaitlist, isPending } = useLeaveWaitlist(eventId);

  const handleLeave = async () => {
    await leaveWaitlist();
    onLeft();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: BG,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: HAIRLINE_2,
            padding: 24,
            width: '100%',
            maxWidth: 340,
            gap: 16,
          }}
        >
          <Text
            className="font-serif"
            style={{ color: TEXT_0, fontSize: 20, lineHeight: 24 }}
          >
            Leave the waitlist?
          </Text>
          <Text
            className="font-outfit"
            style={{ color: TEXT_2, fontSize: 14.5, lineHeight: 21 }}
          >
            You'll lose{' '}
            <Text style={{ color: TEXT_0, fontWeight: '600' }}>
              position #{position}
            </Text>
            . If a seat opens you won't be notified.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: HAIRLINE_2,
              }}
            >
              <Text
                className="font-outfit"
                style={{ color: TEXT_0, fontWeight: '600', fontSize: 14 }}
              >
                Stay
              </Text>
            </Pressable>
            <Pressable
              onPress={handleLeave}
              disabled={isPending}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ORANGE,
              }}
            >
              {isPending ? (
                <ActivityIndicator color={ORANGE_INK} />
              ) : (
                <Text
                  className="font-outfit"
                  style={{ color: ORANGE_INK, fontWeight: '700', fontSize: 14 }}
                >
                  Leave
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
