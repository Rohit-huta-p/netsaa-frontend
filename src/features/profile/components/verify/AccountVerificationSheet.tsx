import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { P } from '../edit/EditModalPrimitives';
import { AccountVerificationBody } from './AccountVerificationBody';

type Props = { visible: boolean; onClose: () => void };

/**
 * Bottom-sheet wrapper around the shared AccountVerificationBody, opened from the
 * profile verification status pill. Mirrors the "Secure your account" sheet in
 * DOCS/04-design/mockups/email-verify-in-edit-modal.html.
 */
export function AccountVerificationSheet({ visible, onClose }: Props) {
    if (!visible) return null;
    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
                    <Pressable onPress={() => {}} style={{ backgroundColor: P.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: P.border, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '88%' }}>
                        {/* drag handle */}
                        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                        </View>
                        {/* editorial header (mockup "Secure your account" framing) */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 18 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: P.orange, marginBottom: 6 }}>Account security</Text>
                                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: P.textPrimary, letterSpacing: -0.3 }}>Secure your account</Text>
                            </View>
                            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
                                <X size={16} color={P.textSecondary} />
                            </Pressable>
                        </View>
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 2, paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            <AccountVerificationBody />
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export default AccountVerificationSheet;
