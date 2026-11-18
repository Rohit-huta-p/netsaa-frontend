// src/features/hirer-hub/components/HubTopTabs.tsx
//
// Top-level segmented control for the owner hub: Applicants | Discussion.
// Sits between the gig header (ghead) and the stage row, a faithful port of
// `.htabs` in DOCS/04-design/mockups/manage-gig.html (variant A). The
// Discussion cell carries a badge = comments posted since the owner last
// opened the thread (see useDiscussionBadge). Space Grotesk isn't loaded in
// the app, so labels use Outfit (the hub's UI face); the active state reads
// from the grey fill + white label, not weight.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TAB_ON, TAB_OFF, TAB_LINE } from './hubTabTokens';

export type HubTopTab = 'applicants' | 'discussion';

const LABEL_ON = '#FFFFFF';
const LABEL_OFF = '#8B8B99';
const BADGE_BG = '#FF6B35'; // orange — matches the mockup + the navbar unread badge
const BADGE_TEXT = '#160A04';
const HORIZ = 24;

type Props = {
    activeTab: HubTopTab;
    onSelectTab: (tab: HubTopTab) => void;
    /** New-comment count on Discussion. 0 / undefined → no badge. */
    discussionBadge?: number;
};

export function HubTopTabs({ activeTab, onSelectTab, discussionBadge = 0 }: Props) {
    const tabs: { key: HubTopTab; label: string; badge: number }[] = [
        { key: 'applicants', label: 'Applicants', badge: 0 },
        { key: 'discussion', label: 'Discussion', badge: discussionBadge },
    ];
    return (
        <View
            accessibilityRole="tablist"
            style={{
                flexDirection: 'row',
                marginHorizontal: HORIZ,
                marginTop: 12,
                marginBottom: 2,
                backgroundColor: TAB_OFF,
                borderWidth: 1,
                borderColor: TAB_LINE,
                borderRadius: 11,
                overflow: 'hidden',
            }}>
            {tabs.map((t, i) => {
                const on = t.key === activeTab;
                const showBadge = t.badge > 0;
                return (
                    <TouchableOpacity
                        key={t.key}
                        onPress={() => onSelectTab(t.key)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={showBadge ? `${t.label}, ${t.badge} new` : t.label}
                        activeOpacity={0.85}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 7,
                            height: 38,
                            backgroundColor: on ? TAB_ON : 'transparent',
                            borderLeftWidth: i === 0 ? 0 : 1,
                            borderLeftColor: TAB_LINE,
                        }}>
                        <Text
                            style={{
                                fontFamily: 'Outfit-SemiBold',
                                fontSize: 13,
                                letterSpacing: 0.2,
                                color: on ? LABEL_ON : LABEL_OFF,
                            }}>
                            {t.label}
                        </Text>
                        {showBadge ? (
                            <View
                                style={{
                                    minWidth: 18,
                                    height: 18,
                                    paddingHorizontal: 5,
                                    borderRadius: 9,
                                    backgroundColor: BADGE_BG,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, color: BADGE_TEXT }}>
                                    {t.badge > 99 ? '99+' : t.badge}
                                </Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default HubTopTabs;
