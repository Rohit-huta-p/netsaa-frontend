// src/features/hirer-hub/components/ApplicantActionSheet.tsx
//
// Bottom-sheet modal opened by tapping an Applicants row body. Shows the
// applicant's full context (cover note, portfolio) plus all 4 actions:
// Shortlist / View profile / Reject / Hire.

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { X, Check, UserCheck, Eye, ExternalLink } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg0: '#07070B', bg1: '#0F0F16', bg2: '#16161F',
    line: 'rgba(255,255,255,0.05)', line2: 'rgba(255,255,255,0.09)',
    orange: '#FF6B35', green: '#22C55E', red: '#EF4444', blue: '#60A5FA',
};

type Props = {
    visible: boolean;
    application: any | null;
    onClose: () => void;
    onShortlist: (id: string) => void;
    onReject: (id: string) => void;
    onHire: (id: string) => void;
    onViewProfile: (artistId: string) => void;
};

export function ApplicantActionSheet({
    visible, application, onClose, onShortlist, onReject, onHire, onViewProfile,
}: Props) {
    if (!visible || !application) return null;

    const displayName = ((application.artistSnapshot?.displayName ?? '') as string).trim() || 'Anonymous';
    const initials = displayName.split(/\s+/).map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';
    const matchScore = application.matchScore;
    const stats = [
        application.artistSnapshot?.artistType,
        application.artistSnapshot?.rating ? `${application.artistSnapshot.rating}★` : null,
        application.artistSnapshot?.experience ? `${application.artistSnapshot.experience}y` : null,
        application.artistSnapshot?.location,
    ].filter(Boolean).join(' · ');
    const portfolioLinks: string[] = application.portfolioLinks ?? [];
    const status = application.status ?? 'applied';

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <Pressable onPress={(e) => e.stopPropagation()} style={{
                    backgroundColor: COLORS.bg0,
                    borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    paddingTop: 12, paddingBottom: 32,
                    maxHeight: '90%',
                }}>
                    {/* drag handle */}
                    <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 12 }} />

                    {/* header */}
                    <View style={{ paddingHorizontal: 24, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            {status === 'shortlisted' ? 'Shortlisted' : 'Applicant'}
                        </Text>
                        <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
                            <X size={20} color={COLORS.text2} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                        {/* artist identity */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                            <View style={{
                                width: 56, height: 56, borderRadius: 16,
                                backgroundColor: COLORS.bg2,
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Text style={{ color: COLORS.text0, fontSize: 18, fontWeight: '700' }}>{initials}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.text0, letterSpacing: -0.3 }}>
                                        {displayName}
                                    </Text>
                                    {matchScore != null && (
                                        <Text style={{ color: COLORS.green, fontSize: 12, fontWeight: '700' }}>
                                            {matchScore}% match
                                        </Text>
                                    )}
                                </View>
                                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 4 }}>{stats || '—'}</Text>
                            </View>
                        </View>

                        {/* cover note */}
                        {application.coverNote && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                                    Cover note
                                </Text>
                                <Text style={{ color: COLORS.text1, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>
                                    "{application.coverNote}"
                                </Text>
                            </View>
                        )}

                        {/* portfolio */}
                        {portfolioLinks.length > 0 && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                                    Portfolio
                                </Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {portfolioLinks.map((link, i) => (
                                        <View
                                            key={i}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                                                backgroundColor: 'rgba(255,107,53,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.20)',
                                            }}>
                                            <ExternalLink size={11} color={COLORS.orange} />
                                            <Text style={{ color: COLORS.orange, fontSize: 11, fontWeight: '700' }}>Link {i + 1}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* proposed rate */}
                        {application.proposedRate != null && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
                                    Proposed rate
                                </Text>
                                <Text style={{ color: COLORS.text0, fontSize: 16, fontWeight: '700' }}>
                                    ₹{Number(application.proposedRate).toLocaleString('en-IN')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* actions */}
                    <View style={{ paddingHorizontal: 24, paddingTop: 8, gap: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {status !== 'shortlisted' && (
                                <ActionBtn
                                    icon={UserCheck}
                                    label="Shortlist"
                                    accent={COLORS.blue}
                                    onPress={() => onShortlist(application._id)}
                                />
                            )}
                            <ActionBtn
                                icon={Eye}
                                label="View profile"
                                accent={COLORS.text2}
                                onPress={() => onViewProfile(application.artistId)}
                            />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <ActionBtn
                                icon={X}
                                label="Reject"
                                accent={COLORS.red}
                                onPress={() => onReject(application._id)}
                            />
                            <ActionBtn
                                icon={Check}
                                label="Hire"
                                accent={COLORS.green}
                                primary
                                onPress={() => onHire(application._id)}
                            />
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function ActionBtn({
    icon: Icon, label, accent, onPress, primary,
}: {
    icon: any; label: string; accent: string; onPress: () => void; primary?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={label}
            style={{
                flex: 1, paddingVertical: 14, borderRadius: 12,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: primary ? accent : `${accent}1A`,
                borderWidth: primary ? 0 : 1, borderColor: `${accent}30`,
            }}>
            <Icon size={14} color={primary ? '#0A0A0F' : accent} strokeWidth={2.5} />
            <Text style={{ color: primary ? '#0A0A0F' : accent, fontSize: 13, fontWeight: '700' }}>{label}</Text>
        </TouchableOpacity>
    );
}
