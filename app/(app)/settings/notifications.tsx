import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Stack } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import SettingRow from '@/components/settings/SettingRow';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import type { INotificationSettings } from '@/types';

/* ── A·Minimal tokens ── */
const BG = '#121216';
const SURFACE = 'rgba(255,255,255,0.028)';
const HAIR = 'rgba(255,255,255,0.055)';
const ORANGE = '#FF6B35';
const TEXT_0 = '#FFFFFF';
const TEXT_3 = '#71717A';

type Field = keyof INotificationSettings;

/* ── Section header ── */
function SectionHeader({ title }: { title: string }) {
    return (
        <Text style={{
            fontSize: 11, fontFamily: 'Outfit-SemiBold', color: TEXT_3,
            letterSpacing: 0.8, textTransform: 'uppercase',
            paddingHorizontal: 20, marginBottom: 8,
        }}>
            {title}
        </Text>
    );
}

/* ── Indented sub-toggle row for gig notifications ── */
function SubToggleRow({ label, value, onToggle, disabled }: {
    label: string; value: boolean; onToggle: (v: boolean) => void; disabled?: boolean;
}) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingLeft: 48, paddingRight: 16, paddingVertical: 12,
            borderTopWidth: 1, borderTopColor: HAIR,
            opacity: disabled ? 0.35 : 1,
        }}>
            {/* vertical hairline tree branch */}
            <View style={{
                position: 'absolute', left: 28, top: 0, bottom: 0,
                width: 1, backgroundColor: HAIR,
            }} />
            <Text style={{ flex: 1, fontSize: 13, fontFamily: 'Outfit-Regular', color: TEXT_0 }}>
                {label}
            </Text>
            <Switch
                value={value}
                onValueChange={onToggle}
                disabled={disabled}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: ORANGE }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.12)"
            />
        </View>
    );
}

export default function NotificationSettings() {
    const { data: settings } = useSettings();
    const { mutate: update } = useUpdateSettings();

    const n = settings?.notifications;

    const tog = (field: Field) => (v: boolean) =>
        update({ notifications: { [field]: v } });

    if (!n) return null;

    const gigsOff = !n.gigUpdates;

    return (
        <>
            <Stack.Screen options={{ title: 'Notifications' }} />
            <View style={{ flex: 1, backgroundColor: BG }}>
                <AppScrollView>

                    {/* ── Channels ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Channels" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow type="toggle" label="Push Notifications"  description="Device alerts"            value={n.pushNotifications}  onToggle={tog('pushNotifications')} />
                            <SettingRow type="toggle" label="Email Notifications" description="Updates to your inbox"    value={n.emailNotifications} onToggle={tog('emailNotifications')} />
                            <SettingRow type="toggle" label="SMS Notifications"   description="Text message alerts (India only)" value={n.smsNotifications}   onToggle={tog('smsNotifications')} />
                        </View>
                    </View>

                    {/* ── Activity ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Activity" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow type="toggle" label="Connection Requests" description="When someone wants to connect" value={n.allowConnectionRequests} onToggle={tog('allowConnectionRequests')} />
                            <SettingRow type="toggle" label="Messages"           description="New inbox messages"              value={n.messages}               onToggle={tog('messages')} />
                            <SettingRow type="toggle" label="Profile Views"      description="When someone views your profile" value={n.profileViews}           onToggle={tog('profileViews')} />
                        </View>
                    </View>

                    {/* ── Gigs ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Gigs" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow type="toggle" label="Gig Updates" description="All gig-related notifications" value={n.gigUpdates} onToggle={tog('gigUpdates')} />
                            <SubToggleRow label="Shortlisted for a gig"  value={n.gigShortlisted} onToggle={tog('gigShortlisted')} disabled={gigsOff} />
                            <SubToggleRow label="Hired for a gig"        value={n.gigHired}       onToggle={tog('gigHired')}       disabled={gigsOff} />
                            <SubToggleRow label="Not selected"           value={n.gigNotSelected} onToggle={tog('gigNotSelected')} disabled={gigsOff} />
                            <SubToggleRow label="Application cancelled"  value={n.gigCancelled}   onToggle={tog('gigCancelled')}   disabled={gigsOff} />
                            <SubToggleRow label="Deadline approaching"   value={n.gigDeadline}    onToggle={tog('gigDeadline')}    disabled={gigsOff} />
                        </View>
                    </View>

                    {/* ── Events ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Events" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow type="toggle" label="Event Updates" description="Updates on events you're registered for" value={n.eventUpdates} onToggle={tog('eventUpdates')} />
                        </View>
                    </View>

                    {/* ── Payments ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Payments" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow type="toggle" label="Payment Received" description="When you get paid for a gig or event" value={n.paymentReceived} onToggle={tog('paymentReceived')} />
                            <SettingRow type="toggle" label="Payment Sent"     description="When your payment is dispatched"       value={n.paymentSent}     onToggle={tog('paymentSent')} />
                            <SettingRow type="toggle" label="Refunds"          description="Refund status updates"                value={n.paymentRefunds}  onToggle={tog('paymentRefunds')} />
                        </View>
                    </View>

                    {/* ── Marketing ── */}
                    <View style={{ marginTop: 24 }}>
                        <SectionHeader title="Marketing" />
                        <View style={{
                            backgroundColor: SURFACE, borderRadius: 14,
                            marginHorizontal: 16, overflow: 'hidden',
                            borderWidth: 1, borderColor: HAIR,
                        }}>
                            <SettingRow type="toggle" label="Marketing Emails" description="Product news, tips & special offers" value={n.marketing} onToggle={tog('marketing')} />
                        </View>
                    </View>

                    {/* ── Event Preferences 3×3 matrix ── */}
                    <View style={{ marginTop: 24, marginBottom: 48 }}>
                        <SectionHeader title="Event Preferences" />
                        <NotificationPreferences />
                    </View>

                </AppScrollView>
            </View>
        </>
    );
}
