import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, CreditCard, Smartphone } from 'lucide-react-native';
import { useContract, useInitiatePayment } from '@/hooks/usePayments';

/**
 * Payment Checkout Screen
 *
 * Flow:
 * 1. Show contract summary + amount
 * 2. User taps "Pay Now"
 * 3. We call initiatePayment → get Razorpay order
 * 4. Open Razorpay checkout (native SDK or WebView)
 * 5. On success → confirmPayment → navigate to confirmation
 *
 * For MVP: show order creation, Razorpay integration placeholder
 */

export default function CheckoutScreen() {
    const { contractId } = useLocalSearchParams<{ contractId: string }>();
    const router = useRouter();
    const { data, isLoading } = useContract(contractId || '');
    const initiateMutation = useInitiatePayment();
    const [paying, setPaying] = useState(false);

    const contract = data?.data;

    if (isLoading) return <View style={styles.container}><ActivityIndicator color="#F97316" /></View>;
    if (!contract) return <View style={styles.container}><Text style={styles.error}>Contract not found</Text></View>;

    const handlePay = async () => {
        setPaying(true);
        try {
            const result = await initiateMutation.mutateAsync({
                contractId: contract._id,
                paymentStructure: 'full',
            });

            const orderData = result?.data;
            if (!orderData?.razorpayOrderId) {
                Alert.alert('Error', 'Could not create payment order');
                return;
            }

            // TODO: Open Razorpay checkout with orderData
            // For MVP, simulate success
            Alert.alert(
                'Payment Order Created',
                `Order ID: ${orderData.razorpayOrderId}\nAmount: Rs. ${orderData.amount}\n\nRazorpay checkout will open here in production.`,
                [
                    {
                        text: 'Simulate Success',
                        onPress: () => router.replace('/(app)/payments/success'),
                    },
                ]
            );
        } catch (err: any) {
            Alert.alert('Payment Failed', err?.response?.data?.meta?.message || 'Something went wrong');
        } finally {
            setPaying(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Checkout</Text>

            {/* Order summary */}
            <View style={styles.summaryCard}>
                <Text style={styles.gigTitle}>{contract.terms.gigTitle}</Text>
                <Text style={styles.gigMeta}>
                    {contract.terms.location.city} · {new Date(contract.terms.dates.start).toLocaleDateString()}
                </Text>

                <View style={styles.divider} />

                <View style={styles.lineItem}>
                    <Text style={styles.lineLabel}>Gig amount</Text>
                    <Text style={styles.lineValue}>Rs. {contract.terms.amount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.lineItem}>
                    <Text style={styles.lineLabel}>Platform fee ({(contract.terms.platformFeeRate * 100).toFixed(0)}%)</Text>
                    <Text style={styles.lineValue}>Rs. {contract.terms.platformFeeAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.lineItem}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>Rs. {contract.terms.amount.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.artistReceives}>
                    Artist receives: Rs. {contract.terms.artistReceives.toLocaleString('en-IN')}
                </Text>
            </View>

            {/* Trust indicators */}
            <View style={styles.trustRow}>
                <Shield size={14} color="#34D399" />
                <Text style={styles.trustText}>Instant split via Razorpay Route. No escrow.</Text>
            </View>

            {/* Pay button */}
            <Pressable onPress={handlePay} disabled={paying} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtn}>
                    {paying ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <CreditCard size={20} color="#fff" />
                            <Text style={styles.payBtnText}>Pay Rs. {contract.terms.amount.toLocaleString('en-IN')}</Text>
                        </>
                    )}
                </LinearGradient>
            </Pressable>

            <Pressable style={styles.offlineBtn} onPress={() => Alert.alert('Offline Payment', 'Record UPI/cash payment flow coming soon')}>
                <Smartphone size={16} color="#6B6878" />
                <Text style={styles.offlineBtnText}>Record offline payment instead</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A10', padding: 20 },
    heading: { fontFamily: 'Outfit-Bold', fontSize: 24, color: '#F0ECE6', marginBottom: 24 },
    error: { fontFamily: 'Outfit-Regular', fontSize: 16, color: '#EF4444', textAlign: 'center', marginTop: 40 },
    summaryCard: { backgroundColor: '#121018', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 20 },
    gigTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 18, color: '#F0ECE6', marginBottom: 4 },
    gigMeta: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#6B6878', marginBottom: 16 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 12 },
    lineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    lineLabel: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#6B6878' },
    lineValue: { fontFamily: 'Outfit-Medium', fontSize: 14, color: '#F0ECE6' },
    totalLabel: { fontFamily: 'Outfit-Bold', fontSize: 16, color: '#F0ECE6' },
    totalValue: { fontFamily: 'Outfit-Bold', fontSize: 20, color: '#FFFFFF' },
    artistReceives: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#34D399', marginTop: 4, textAlign: 'right' },
    trustRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    trustText: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#6B6878' },
    payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 14 },
    payBtnText: { fontFamily: 'Outfit-Bold', fontSize: 17, color: '#fff' },
    offlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 12 },
    offlineBtnText: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#6B6878' },
});
