import React from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';

const BG = '#09090b';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE_2 = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  /** Confirm-button label. Defaults to "Withdraw". */
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * In-app confirm sheet for withdrawing a pre-payment event request.
 *
 * Replaces an `Alert.alert(…, …, [buttons])` confirm, which does NOT render on
 * react-native-web (netsaa.com) — tapping "Withdraw" there showed nothing and
 * the cancel it gated never ran. This is a plain <Modal>, so the confirm works
 * on web and native alike. Styling mirrors LeaveWaitlistConfirm.
 */
export default function WithdrawConfirm({
  visible,
  title,
  body,
  confirmLabel = 'Withdraw',
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
          <Text className="font-serif" style={{ color: TEXT_0, fontSize: 20, lineHeight: 24 }}>
            {title}
          </Text>
          <Text className="font-outfit" style={{ color: TEXT_2, fontSize: 14.5, lineHeight: 21 }}>
            {body}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={onClose}
              disabled={loading}
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
              <Text className="font-outfit" style={{ color: TEXT_0, fontWeight: '600', fontSize: 14 }}>
                Keep it
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ORANGE,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color={ORANGE_INK} />
              ) : (
                <Text className="font-outfit" style={{ color: ORANGE_INK, fontWeight: '700', fontSize: 14 }}>
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
