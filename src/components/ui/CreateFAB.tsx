import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';

interface Props {
    defaultTab?: 'gig' | 'event';
}

/**
 * Floating Action Button to create gig/event.
 * Drop into any screen: <CreateFAB defaultTab="gig" />
 */
export default function CreateFAB({ defaultTab = 'gig' }: Props) {
    const router = useRouter();

    return (
        <Pressable
            onPress={() => router.push('/(app)/create')}
            style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.92 }] }]}
        >
            <LinearGradient
                colors={['#EC4899', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Plus size={28} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        zIndex: 100,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    gradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
