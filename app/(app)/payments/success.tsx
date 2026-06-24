import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, ArrowRight } from 'lucide-react-native';

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const scale = useRef(new Animated.Value(0)).current;
    const fade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
            Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
                <LinearGradient colors={['#EC4899', '#F97316']} style={styles.iconCircle}>
                    <CheckCircle size={48} color="#fff" strokeWidth={2} />
                </LinearGradient>
            </Animated.View>

            <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
                <Text style={styles.title}>Payment Successful!</Text>
                <Text style={styles.subtitle}>
                    Money sent directly to the artist's bank account. No middlemen.
                </Text>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>What happens next?</Text>
                    <Text style={styles.infoItem}>1. Artist gets notified of the payment</Text>
                    <Text style={styles.infoItem}>2. Contract status moves to "Active"</Text>
                    <Text style={styles.infoItem}>3. Coordinate via chat for the gig</Text>
                    <Text style={styles.infoItem}>4. After the gig, confirm completion</Text>
                </View>

                <Pressable onPress={() => router.replace('/(app)/contracts')} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                    <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                        <Text style={styles.btnText}>View My Contracts</Text>
                        <ArrowRight size={18} color="#fff" />
                    </LinearGradient>
                </Pressable>

                <Pressable onPress={() => router.replace('/(app)/gigs')} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>Back to Gigs</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A10', alignItems: 'center', justifyContent: 'center', padding: 24 },
    iconWrap: { marginBottom: 32 },
    iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Outfit-Bold', fontSize: 28, color: '#F0ECE6', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontFamily: 'Outfit-Regular', fontSize: 15, color: '#6B6878', textAlign: 'center', maxWidth: 300, marginBottom: 32, lineHeight: 22 },
    infoCard: { backgroundColor: '#121018', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', width: '100%', maxWidth: 360, marginBottom: 32 },
    infoTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F0ECE6', marginBottom: 12 },
    infoItem: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#6B6878', lineHeight: 22 },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: 300 },
    btnText: { fontFamily: 'Outfit-Bold', fontSize: 16, color: '#fff' },
    secondaryBtn: { marginTop: 12, paddingVertical: 12 },
    secondaryBtnText: { fontFamily: 'Outfit-Medium', fontSize: 14, color: '#6B6878' },
});
