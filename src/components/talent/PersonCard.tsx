// src/components/talent/PersonCard.tsx
//
// Shared directory talent card. The role badge sits UNDER the name (on the meta
// line). The single right-hand action is a state-aware "Connect" pill that opens
// the Connect sheet (connect-only and/or invite). No favourite/save heart.
import { View, Text, Pressable, Image } from 'react-native';
import { Link2, Clock, Check, Building2 } from 'lucide-react-native';
import { DirectoryPerson } from '@/services/directoryService';

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
    artist: { label: 'Artist', color: '#A78BFA' },
    creative_lead: { label: 'Lead', color: '#FBBF24' },
    agency: { label: 'Agency', color: '#2DD4BF' },
};

const PURPLE = '#8B5CF6';
const GREEN = '#22C55E';

export type ConnState = 'none' | 'pending' | 'connected';

export function PersonCard({
    person,
    onPress,
    connState,
    onConnect,
}: {
    person: DirectoryPerson;
    onPress: () => void;
    /** Connection status relative to the viewer. Omit to hide the Connect pill (e.g. self). */
    connState?: ConnState;
    /** Opens the Connect sheet. */
    onConnect?: () => void;
}) {
    const kindKey = person.kind || person.role;
    const isAgency = kindKey === 'agency';
    const badge = ROLE_BADGE[kindKey] ?? { label: kindKey, color: '#71717a' };
    const initials = (person.displayName || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');

    const meta = isAgency
        ? (person.services && person.services.length
              ? person.services.slice(0, 2).join(' · ')
              : person.city) || 'Agency'
        : [person.artType, person.city].filter(Boolean).join(' · ') ||
          person.headline ||
          'NETSA member';

    return (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: 11,
                marginBottom: 10,
            }}
        >
            {person.profileImageUrl ? (
                <Image
                    source={{ uri: person.profileImageUrl }}
                    style={{ width: 44, height: 44, borderRadius: isAgency ? 11 : 22 }}
                />
            ) : (
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: isAgency ? 11 : 22,
                        backgroundColor: badge.color + '26',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {isAgency ? (
                        <Building2 size={20} color={badge.color} />
                    ) : (
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: badge.color, fontSize: 15 }}>
                            {initials}
                        </Text>
                    )}
                </View>
            )}

            {/* Name (line 1) + role badge & meta (line 2, under the name) */}
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    numberOfLines={1}
                    style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 14 }}
                >
                    {person.displayName}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 3,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: badge.color + '26',
                            borderRadius: 99,
                            paddingHorizontal: 7,
                            paddingVertical: 1,
                            flexShrink: 0,
                        }}
                    >
                        <Text
                            style={{ fontFamily: 'Outfit-SemiBold', color: badge.color, fontSize: 10 }}
                        >
                            {badge.label}
                        </Text>
                    </View>
                    <Text
                        numberOfLines={1}
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#71717a',
                            fontSize: 12,
                            flexShrink: 1,
                        }}
                    >
                        {meta}
                    </Text>
                </View>
            </View>

            {/* Connect pill — single action; opens the Connect sheet. State-aware label. */}
            {connState && onConnect && <ConnectButton state={connState} onConnect={onConnect} />}
        </Pressable>
    );
}

// ─── Connect pill ───────────────────────────────────────────────────────────
// Always opens the sheet. Label reflects connection status:
// none → "Connect" (purple), pending → "Pending" (grey), connected → "Connected" (green).
function ConnectButton({ state, onConnect }: { state: ConnState; onConnect: () => void }) {
    const color = state === 'connected' ? GREEN : state === 'pending' ? '#71717a' : PURPLE;
    const label = state === 'connected' ? 'Connected' : state === 'pending' ? 'Pending' : 'Connect';
    const Icon = state === 'connected' ? Check : state === 'pending' ? Clock : Link2;

    return (
        <Pressable
            onPress={(e) => {
                e.stopPropagation?.();
                onConnect();
            }}
            hitSlop={8}
            accessibilityLabel={
                state === 'connected'
                    ? 'open-connect-connected'
                    : state === 'pending'
                    ? 'open-connect-pending'
                    : 'open-connect'
            }
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderWidth: 1,
                borderColor: color,
                backgroundColor: state === 'none' ? 'rgba(139,92,246,0.10)' : 'transparent',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexShrink: 0,
            }}
        >
            <Icon size={13} color={color} />
            <Text style={{ fontFamily: 'Outfit-SemiBold', color, fontSize: 11 }}>{label}</Text>
        </Pressable>
    );
}

export default PersonCard;
