import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Clock, X } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import { useJoinWaitlist } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { computeCustomerBreakdown, formatRupees } from '@/lib/eventPricing';

const BG = '#09090b';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE_2 = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';
const YELLOW = '#EAB308';
const PAD = 20;

interface Props {
  visible: boolean;
  event: EventDoc;
  onClose: () => void;
  onJoined: (result: { entryId: string; position: number; status: string }) => void;
}

export default function WaitlistJoinSheet({ visible, event, onClose, onJoined }: Props) {
  const user = useAuthStore((s) => s.user);
  const maxGuests = event.maxGuestsPerRegistration ?? 5;
  const isPaid = event.registrationMode === 'paid_ticket';
  const ticketPrice: number = (event as any).pricing?.amount ?? 0;

  const [quantity, setQuantity] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const derivedName: string =
    user?.displayName ?? user?.firstName ?? '';
  const derivedPhone: string = user?.phoneNumber ?? '';

  const needsNameInput = !derivedName;
  const needsPhoneInput = !derivedPhone;

  const { mutateAsync: joinWaitlist, isPending } = useJoinWaitlist(event._id);

  const breakdown = isPaid ? computeCustomerBreakdown(ticketPrice, quantity) : null;

  const handleJoin = async () => {
    const fullName = needsNameInput ? nameInput.trim() : derivedName;
    const phone = needsPhoneInput ? phoneInput.trim() : derivedPhone;
    if (!fullName || !phone) return;

    const result = await joinWaitlist({
      quantity,
      attendeeSnapshot: { fullName, phone },
    });
    onJoined(result);
  };

  const canSubmit =
    !isPending &&
    (!needsNameInput || nameInput.trim().length > 0) &&
    (!needsPhoneInput || phoneInput.trim().length > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: BG }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: PAD,
            paddingTop: 20,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderColor: HAIRLINE_2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(234,179,8,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color={YELLOW} />
            </View>
            <Text
              className="font-serif"
              style={{ color: TEXT_0, fontSize: 20, lineHeight: 24 }}
            >
              Join the waitlist
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={22} color={TEXT_2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 22, paddingBottom: 40, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Position indicator */}
          <View
            style={{
              backgroundColor: 'rgba(234,179,8,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(234,179,8,0.18)',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text
              className="font-mono"
              style={{
                color: YELLOW,
                fontSize: 9.5,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              Position
            </Text>
            <Text
              className="font-outfit"
              style={{ color: TEXT_0, fontSize: 15, fontWeight: '600' }}
            >
              You'll get a spot in line
            </Text>
          </View>

          {/* Quantity picker */}
          <View>
            <Text
              className="font-mono"
              style={{
                color: TEXT_2,
                fontSize: 9.5,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontWeight: '600',
                marginBottom: 10,
              }}
            >
              Seats
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setQuantity(n)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: quantity === n ? ORANGE : SURFACE,
                    borderWidth: 1,
                    borderColor: quantity === n ? ORANGE : HAIRLINE_2,
                  }}
                >
                  <Text
                    className="font-outfit"
                    style={{
                      color: quantity === n ? ORANGE_INK : TEXT_0,
                      fontWeight: '700',
                      fontSize: 15,
                    }}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Attendee inputs (only shown when user profile is incomplete) */}
          {(needsNameInput || needsPhoneInput) && (
            <View style={{ gap: 10 }}>
              {needsNameInput && (
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your full name"
                  placeholderTextColor={TEXT_2}
                  style={{
                    backgroundColor: SURFACE,
                    borderWidth: 1,
                    borderColor: HAIRLINE_2,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: TEXT_0,
                    fontSize: 15,
                  }}
                />
              )}
              {needsPhoneInput && (
                <TextInput
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="Mobile number"
                  placeholderTextColor={TEXT_2}
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: SURFACE,
                    borderWidth: 1,
                    borderColor: HAIRLINE_2,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: TEXT_0,
                    fontSize: 15,
                  }}
                />
              )}
            </View>
          )}

          {/* Promotion copy */}
          <View
            style={{
              backgroundColor: SURFACE,
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: HAIRLINE_2,
            }}
          >
            <Text
              className="font-outfit"
              style={{ color: TEXT_2, fontSize: 13.5, lineHeight: 20 }}
            >
              If a seat opens, you'll get a push. You'll have{' '}
              <Text style={{ color: TEXT_0, fontWeight: '600' }}>30 minutes</Text>{' '}
              to confirm.
            </Text>
          </View>

          {/* Paid event breakdown */}
          {isPaid && breakdown && (
            <View
              style={{
                backgroundColor: SURFACE,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: HAIRLINE_2,
                gap: 8,
              }}
            >
              <Text
                className="font-mono"
                style={{
                  color: TEXT_2,
                  fontSize: 9.5,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  marginBottom: 2,
                }}
              >
                If promoted, you'll pay
              </Text>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text
                  className="font-outfit"
                  style={{ color: TEXT_2, fontSize: 13.5 }}
                >
                  {quantity} × {formatRupees(ticketPrice)}
                </Text>
                <Text
                  className="font-outfit"
                  style={{ color: TEXT_0, fontSize: 13.5 }}
                >
                  {formatRupees(breakdown.ticketSubtotal)}
                </Text>
              </View>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text
                  className="font-outfit"
                  style={{ color: TEXT_2, fontSize: 13.5 }}
                >
                  Service fee
                </Text>
                <Text
                  className="font-outfit"
                  style={{ color: TEXT_0, fontSize: 13.5 }}
                >
                  {formatRupees(breakdown.serviceFee)}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: HAIRLINE_2,
                  marginVertical: 2,
                }}
              />
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text
                  className="font-outfit"
                  style={{ color: TEXT_0, fontWeight: '700', fontSize: 15 }}
                >
                  Total
                </Text>
                <Text
                  className="font-serif"
                  style={{ color: TEXT_0, fontSize: 17 }}
                >
                  {formatRupees(breakdown.total)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer CTA */}
        <View
          style={{
            paddingHorizontal: PAD,
            paddingTop: 12,
            paddingBottom: 32,
            borderTopWidth: 1,
            borderColor: HAIRLINE_2,
          }}
        >
          <Pressable
            onPress={handleJoin}
            disabled={!canSubmit}
            style={{
              height: 52,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSubmit ? YELLOW : SURFACE,
              borderWidth: canSubmit ? 0 : 1,
              borderColor: HAIRLINE_2,
            }}
          >
            {isPending ? (
              <ActivityIndicator color={ORANGE_INK} />
            ) : (
              <Text
                className="font-outfit"
                style={{
                  color: canSubmit ? '#1A1200' : TEXT_2,
                  fontWeight: '700',
                  fontSize: 15,
                }}
              >
                Join waitlist
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
