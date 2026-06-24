// src/features/contract-workspace/ContractWorkspace.tsx
//
// Single-scroll workspace per per-hire contract. Mounts each section in
// order, wires a sticky CTA at the bottom. Phase 3A — many CTAs route to
// 'Coming soon' Alerts.

import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, Alert, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';

import useAuthStore from '@/stores/authStore';
import { useContract, useSwitchContractPaymentMethod, useDeclineContract } from '@/hooks/usePayments';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import type { ContractPaymentMethod } from '@/services/paymentService';

import { computeContractTimelineStage } from './utils/computeContractTimelineStage';
import { computePrimaryCTA, type PrimaryCTAIntent, type ViewerRole } from './utils/computePrimaryCTA';
import { useContractActivity } from './hooks/useContractActivity';

import { ContractHero } from './components/ContractHero';
import { ContractStatusTimeline } from './components/ContractStatusTimeline';
import { ContractSignatures } from './components/ContractSignatures';
import { ContractPaymentSection } from './components/ContractPaymentSection';
import { ContractDocuments } from './components/ContractDocuments';
import { ContractAmendments } from './components/ContractAmendments';
import { ContractActivity } from './components/ContractActivity';
import { ContractEdgeCases } from './components/ContractEdgeCases';
import { ContractStickyCTA } from './components/ContractStickyCTA';

import { useContractPdf } from '@/features/contract-pdf/hooks/useContractPdf';
import { buildFromContract } from '@/features/contract-pdf/utils/buildContractData';

const COLORS = {
    bg0: '#07070B', text1: '#B8B1A6', line: 'rgba(255,255,255,0.05)',
};

type Props = { contractId: string };

export function ContractWorkspace({ contractId }: Props) {
    const router = useRouter();
    const userId = useAuthStore((s) => (s.user as any)?._id || (s.user as any)?.id);
    const { data, isLoading } = useContract(contractId);
    const switchMutation = useSwitchContractPaymentMethod();
    const declineMutation = useDeclineContract();

    const [methodModalOpen, setMethodModalOpen] = useState(false);
    const [pendingMethod, setPendingMethod] = useState<ContractPaymentMethod>('on_platform');

    const contract = data?.data;
    const activity = useContractActivity(contract);
    const pdf = useContractPdf();

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }
    if (!contract) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: COLORS.text1 }}>Contract not found</Text>
            </View>
        );
    }

    const isHirer = String(contract.hirerId) === String(userId);
    const isArtist = String(contract.artistId) === String(userId);
    const viewerRole: ViewerRole = isHirer ? 'hirer' : isArtist ? 'artist' : 'other';

    const counterpartName = isHirer
        ? (contract.artistSnapshot?.displayName ?? 'Artist')
        : (contract.hirerSnapshot?.displayName ?? 'Hirer');
    const counterpartRole = (contract.terms?.scopeOfWork ?? 'Lead artist').split('\n')[0].slice(0, 60);

    const stage = computeContractTimelineStage(contract);
    const primaryCTA = computePrimaryCTA(contract, viewerRole);

    const documents: Array<{ label: string; url?: string; date?: string }> = [];
    if (contract.documentUrl || contract.contractPdfUrl) {
        documents.push({
            label: 'Signed contract',
            url: contract.documentUrl ?? contract.contractPdfUrl,
            date: contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : undefined,
        });
    }
    (contract.invoices ?? []).forEach((inv: any, i: number) => {
        if (inv?.url) documents.push({ label: inv.label ?? `Invoice ${i + 1}`, url: inv.url, date: inv.date });
    });

    const switchableStatuses = ['draft', 'sent', 'pending_artist_signature'];
    const canSwitchMethod = isHirer && !contract.artistSignature?.signedAt && switchableStatuses.includes(contract.status);
    const canCancel = isHirer && switchableStatuses.includes(contract.status);

    const handleGeneratePdf = async () => {
        try {
            const pdfData = buildFromContract(contract);
            await pdf.generateAndShare(pdfData);
        } catch (err: any) {
            Alert.alert('Could not generate PDF', err?.message ?? 'Try again.');
        }
    };

    const handleStickyPress = () => {
        const intent: PrimaryCTAIntent = primaryCTA.intent;
        if (primaryCTA.disabled) return;
        if (intent === 'sign-contract') {
            router.push(`/(app)/contracts/${contractId}/sign` as any);
            return;
        }
        if (intent === 'download-pdf') {
            const url = contract.documentUrl ?? contract.contractPdfUrl;
            if (url) {
                Linking.openURL(url).catch(() => Alert.alert('Could not open', 'Document URL invalid.'));
            } else {
                // Generate fresh from contract data instead of "Coming soon"
                handleGeneratePdf();
            }
            return;
        }
        Alert.alert('Coming soon', `${primaryCTA.label} ships in a follow-up release.`);
    };

    const handleSwitchMethod = () => {
        setPendingMethod(contract.paymentMethod ?? 'on_platform');
        setMethodModalOpen(true);
    };
    const confirmSwitchMethod = async () => {
        try {
            await switchMutation.mutateAsync({ id: contractId, paymentMethod: pendingMethod });
            setMethodModalOpen(false);
        } catch (err: any) {
            Alert.alert('Failed', err?.message ?? 'Could not switch payment method.');
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel contract?',
            'This withdraws your offer. The artist will be notified.',
            [
                { text: 'Keep contract', style: 'cancel' },
                {
                    text: 'Cancel offer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await declineMutation.mutateAsync(contractId);
                            router.back();
                        } catch (err: any) {
                            Alert.alert('Failed', err?.message ?? 'Could not cancel.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg0 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back">
                        <ChevronLeft size={20} color="#B8B1A6" />
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="More">
                        <MoreHorizontal size={18} color="#B8B1A6" />
                    </TouchableOpacity>
                </View>

                <ContractHero
                    counterpartName={counterpartName}
                    counterpartRole={counterpartRole}
                    amount={contract.terms?.amount ?? 0}
                    status={contract.status}
                    tier={contract.tier}
                />

                <ContractStatusTimeline stage={stage} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 }} />

                <ContractSignatures
                    hirerName={contract.hirerSnapshot?.displayName ?? 'Hirer'}
                    artistName={contract.artistSnapshot?.displayName ?? 'Artist'}
                    hirerSignature={contract.hirerSignature}
                    artistSignature={contract.artistSignature}
                    viewerRole={viewerRole}
                />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractPaymentSection
                    amount={contract.terms?.amount ?? 0}
                    paidAmount={contract.paidAmount ?? 0}
                    paymentStructure={contract.terms?.paymentStructure ?? 'full'}
                    paymentMethod={contract.paymentMethod ?? 'on_platform'}
                    isHirer={isHirer}
                    eventDate={contract.terms?.dates?.start}
                />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractDocuments
                    documents={documents}
                    onGeneratePdf={handleGeneratePdf}
                    isGeneratingPdf={pdf.isGenerating}
                />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractAmendments amendments={contract.amendments ?? []} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractActivity events={activity} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 28 }} />

                <ContractEdgeCases
                    canSwitchMethod={canSwitchMethod}
                    canCancel={canCancel}
                    onSwitchMethod={handleSwitchMethod}
                    onCancel={handleCancel}
                />
            </ScrollView>

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bg0, borderTopWidth: 1, borderTopColor: COLORS.line }}>
                <ContractStickyCTA cta={primaryCTA} onPress={handleStickyPress} />
            </View>

            {/* Switch payment method modal — preserve existing PaymentMethodSelector */}
            <Modal visible={methodModalOpen} transparent animationType="slide" onRequestClose={() => setMethodModalOpen(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: COLORS.bg0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 }}>
                        <Text style={{ color: '#F3EFE8', fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Switch payment method</Text>
                        <PaymentMethodSelector value={pendingMethod} onChange={setPendingMethod} />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <TouchableOpacity
                                onPress={() => setMethodModalOpen(false)}
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' }}>
                                <Text style={{ color: '#B8B1A6', fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmSwitchMethod}
                                disabled={switchMutation.isPending}
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FF6B35', alignItems: 'center', opacity: switchMutation.isPending ? 0.5 : 1 }}>
                                <Text style={{ color: '#0A0A0F', fontWeight: '700' }}>{switchMutation.isPending ? 'Saving…' : 'Confirm'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
