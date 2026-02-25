import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NeedHelpButtonProps {
    gigId?: string;
    eventId?: string;
    conversationId?: string;
    style?: any;
}

/**
 * Floating "Need Help?" button — NETSA dark theme.
 * Place on critical flows: gig detail, event detail, conversation screens.
 *
 * Usage: <NeedHelpButton gigId={gig._id} />
 */
const NeedHelpButton: React.FC<NeedHelpButtonProps> = ({
    gigId,
    eventId,
    conversationId,
    style,
}) => {
    const router = useRouter();

    const handlePress = () => {
        const params: Record<string, string> = {};
        if (gigId) params.gigId = gigId;
        if (eventId) params.eventId = eventId;
        if (conversationId) params.conversationId = conversationId;

        router.push({
            pathname: '/(app)/support/new-ticket',
            params,
        });
    };

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={handlePress}
            activeOpacity={0.85}
        >
            <View style={styles.inner}>
                <Ionicons name="help-buoy-outline" size={20} color="#FFF" />
                <Text style={styles.text}>Need Help?</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        zIndex: 999,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#9D4EDD',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(199, 125, 255, 0.3)',
        shadowColor: '#9D4EDD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    text: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
});

export default NeedHelpButton;
