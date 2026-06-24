import { View, Text } from 'react-native';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { inviteColors, inviteFonts, inviteRadii } from './inviteTheme';
import { formatBudget, formatEventDate, rolePlural } from './inviteFormat';
import type { RequirementSnapshot } from '@/services/inviteService';

export function RequirementPreview({
    snapshot,
    fallbackTitle,
    role,
}: {
    snapshot?: RequirementSnapshot | null;
    fallbackTitle?: string;
    role: 'artist' | 'creative_lead' | 'agency';
}) {
    const title = snapshot?.title || fallbackTitle || '';
    if (!title) return null;

    const budget = formatBudget(snapshot?.budgetMin, snapshot?.budgetMax);
    const date = formatEventDate(snapshot?.eventDate);
    const city = snapshot?.city || '';
    const craft = snapshot?.craft || '';
    const count = typeof snapshot?.invitedCount === 'number' ? snapshot.invitedCount : null;
    const hasMeta = !!budget || !!date || !!city || !!craft;

    return (
        <View style={{ borderWidth: 1, borderColor: inviteColors.reqBoxBorder, borderRadius: inviteRadii.reqBox, backgroundColor: inviteColors.reqBoxBg, padding: 10, marginTop: 10 }}>
            <Text style={{ fontFamily: inviteFonts.mono, fontSize: 11, letterSpacing: 0.5, color: inviteColors.dim, marginBottom: 4 }}>requirement</Text>
            <Text style={{ fontFamily: inviteFonts.medium, fontSize: 13, color: inviteColors.text, marginBottom: hasMeta ? 6 : 0 }}>{title}</Text>
            {hasMeta && (
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {!!budget && <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 12, color: inviteColors.text }}>{budget}</Text>}
                    {!!date && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Calendar size={13} color={inviteColors.orangeLight} /><Text style={{ fontFamily: inviteFonts.body, fontSize: 12, color: '#d4d4d8' }}>{date}</Text></View>}
                    {!!city && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><MapPin size={13} color={inviteColors.orangeLight} /><Text style={{ fontFamily: inviteFonts.body, fontSize: 12, color: '#d4d4d8' }}>{city}</Text></View>}
                    {!!craft && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: inviteRadii.pill, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ fontFamily: inviteFonts.body, fontSize: 11, color: '#d4d4d8' }}>{craft}</Text></View>}
                </View>
            )}
            {count !== null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Users size={13} color={inviteColors.dim} />
                    <Text style={{ fontFamily: inviteFonts.body, fontSize: 11, color: inviteColors.dim }}>{`${count} ${rolePlural(role, count)} invited`}</Text>
                </View>
            )}
        </View>
    );
}
