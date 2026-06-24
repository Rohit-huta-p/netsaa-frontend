// netsa-mobile/src/features/team/ContactActionSheet.tsx
//
// Bottom-sheet action picker for contacting a team member. Three channels:
//   - WhatsApp: deep-links via wa.me with a prefilled message
//   - Call: tel: deep-link to the artist's phone
//   - In-app message: placeholder until the /messages route ships
//
// Phone resolution: tries the application.artistSnapshot.phoneNumber first
// (set when the artist applied). If absent, the WA + Call options surface
// a friendly "Phone number not shared by this artist yet" toast instead
// of opening a broken link.
//
// Lives under src/features/team/ — reused by HirerGigHub (row contact CTA)
// and the upcoming TeamPage (per-artist row contact CTA).

import React from 'react';
import { Alert, Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MessageCircle, Phone, X, MessageSquare } from 'lucide-react-native';

export interface ContactTarget {
    artistId: string;
    displayName: string;
    phoneNumber?: string;
    /** Optional context for the prefilled WhatsApp message. */
    gigTitle?: string;
}

export interface ContactActionSheetProps {
    visible: boolean;
    onClose: () => void;
    target: ContactTarget | null;
}

function buildWhatsAppUrl(phone: string, prefill: string): string {
    // wa.me expects digits only — no +, no spaces, no dashes.
    const digits = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(prefill);
    return `https://wa.me/${digits}?text=${text}`;
}

function buildPrefillMessage(name: string, gigTitle?: string): string {
    const greet = `Hi ${name.split(' ')[0]}`;
    if (gigTitle) {
        return `${greet}, regarding the gig "${gigTitle}" on NETSA.`;
    }
    return `${greet}, reaching out from NETSA.`;
}

async function openUrl(url: string, fallbackMsg: string) {
    try {
        const can = await Linking.canOpenURL(url);
        if (!can) {
            try {
                Alert.alert('Not available', fallbackMsg);
            } catch {
                /* noop in test env */
            }
            return;
        }
        await Linking.openURL(url);
    } catch {
        try {
            Alert.alert('Could not open', fallbackMsg);
        } catch {
            /* noop */
        }
    }
}

export function ContactActionSheet({ visible, onClose, target }: ContactActionSheetProps) {
    if (!target) return null;

    const { displayName, phoneNumber, gigTitle } = target;
    const hasPhone = !!(phoneNumber && phoneNumber.trim());
    const prefill = buildPrefillMessage(displayName, gigTitle);

    const handleWhatsApp = async () => {
        if (!hasPhone) {
            try {
                Alert.alert('Phone not shared', `${displayName} hasn't shared a phone number yet.`);
            } catch {
                /* noop */
            }
            return;
        }
        const url = buildWhatsAppUrl(phoneNumber!, prefill);
        await openUrl(url, 'WhatsApp may not be installed on this device.');
        onClose();
    };

    const handleCall = async () => {
        if (!hasPhone) {
            try {
                Alert.alert('Phone not shared', `${displayName} hasn't shared a phone number yet.`);
            } catch {
                /* noop */
            }
            return;
        }
        const tel = `tel:${phoneNumber!.replace(/[^0-9+]/g, '')}`;
        await openUrl(tel, 'Calling not supported on this device.');
        onClose();
    };

    const handleInAppMessage = () => {
        try {
            Alert.alert(
                'Coming soon',
                'In-app messaging UI lands in the next ship. Use WhatsApp for now.'
            );
        } catch {
            /* noop */
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.handleWrap}>
                        <View style={styles.handle} />
                    </View>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.eyebrow}>Contact</Text>
                            <Text style={styles.title}>{displayName}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            accessibilityLabel="close-contact-sheet"
                            style={styles.closeBtn}
                        >
                            <X size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleWhatsApp}
                        accessibilityRole="button"
                        accessibilityLabel="contact-whatsapp"
                        style={[styles.action, !hasPhone && styles.actionDisabled]}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(37,211,102,0.10)' }]}>
                            <MessageCircle size={20} color="#25D366" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionTitle}>WhatsApp</Text>
                            <Text style={styles.actionSub}>
                                {hasPhone ? 'Open WA chat with prefilled message' : 'Phone not shared'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCall}
                        accessibilityRole="button"
                        accessibilityLabel="contact-call"
                        style={[styles.action, !hasPhone && styles.actionDisabled]}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,107,53,0.10)' }]}>
                            <Phone size={20} color="#FF6B35" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionTitle}>Call</Text>
                            <Text style={styles.actionSub}>
                                {hasPhone ? 'Direct phone call' : 'Phone not shared'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleInAppMessage}
                        accessibilityRole="button"
                        accessibilityLabel="contact-in-app"
                        style={styles.action}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(139,92,246,0.10)' }]}>
                            <MessageSquare size={20} color="#8B5CF6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionTitle}>In-app message</Text>
                            <Text style={styles.actionSub}>Coming soon</Text>
                        </View>
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
                </View>
            </View>
        </Modal>
    );
}

export default ContactActionSheet;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#0A0A0E',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingBottom: 12,
    },
    handleWrap: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    eyebrow: {
        color: '#FF6B35',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginTop: 2 },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    actionDisabled: { opacity: 0.5 },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: { color: '#F0ECE6', fontSize: 15, fontWeight: '700' },
    actionSub: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
});
