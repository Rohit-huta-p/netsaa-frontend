import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTicket } from '@/hooks/useEvents';

const BG = '#09090b'; const TEXT_0 = '#f4f4f5'; const TEXT_2 = '#71717a'; const TEXT_3 = '#52525b'; const HAIRLINE = 'rgba(255,255,255,0.07)';

export default function MyTicketScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();
  const { data: ticket, isLoading } = useTicket(registrationId);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={TEXT_0} />
        </Pressable>
      </View>
      {isLoading || !ticket ? (
        <Text style={{ color: TEXT_2, textAlign: 'center', marginTop: 40 }} className="font-outfit">Loading ticket…</Text>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: TEXT_0, borderRadius: 16, padding: 22, alignItems: 'center', marginBottom: 16 }}>
            <QRCode value={ticket.qrPayload} size={220} backgroundColor="#f4f4f5" color="#09090b" />
          </View>
          {[['Ticket', ticket.ticketCode], ['Attendees', String(ticket.attendeeCount)], ['Backup code', ticket.backupCode.split('').join(' ')]].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderTopWidth: 1, borderColor: HAIRLINE }}>
              <Text className="font-outfit" style={{ color: TEXT_2, fontSize: 12 }}>{k}</Text>
              <Text className="font-mono" style={{ color: TEXT_0, fontSize: 12.5, fontWeight: '600' }}>{v}</Text>
            </View>
          ))}
          <Text className="font-outfit" style={{ color: TEXT_3, fontSize: 11, textAlign: 'center', marginTop: 18 }}>Show this to the host at the door</Text>
        </View>
      )}
    </View>
  );
}
