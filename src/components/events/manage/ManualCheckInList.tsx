import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useEventRoster } from '@/hooks/useEventRoster';
import { useCheckIn } from '@/hooks/useEvents';

const BG = '#09090b'; const TEXT_0 = '#f4f4f5'; const TEXT_1 = '#a1a1aa'; const TEXT_2 = '#71717a'; const TEXT_3 = '#52525b';
const HAIRLINE = 'rgba(255,255,255,0.07)'; const HAIRLINE_2 = 'rgba(255,255,255,0.1)'; const SURFACE = 'rgba(255,255,255,0.04)';
const GREEN = '#22C55E'; const GREEN_SOFT = 'rgba(34,197,94,0.14)'; const DANGER = '#ef4444'; const ORANGE_INK = '#1A0D06';

export function ManualCheckInList() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useEventRoster(id);
  const checkIn = useCheckIn(id);
  const [query, setQuery] = useState('');
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const rows = data?.rows ?? [];
  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, query],
  );

  const submitCode = async () => {
    if (code.length < 6) return;
    try {
      const r = await checkIn.mutateAsync({ code: code.trim(), method: 'backup' });
      setFeedback({ ok: true, msg: `Checked in ${r.attendeeName}` });
      setCode('');
    } catch (e: any) {
      const m = e?.response?.data?.meta?.message || 'Could not check in';
      setFeedback({ ok: false, msg: m });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: HAIRLINE_2, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={TEXT_0} />
        </Pressable>
        <Text className="font-serif" style={{ color: TEXT_0, fontSize: 20, marginLeft: 12 }}>Manual check-in</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <Text className="font-mono" style={{ color: TEXT_3, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 }}>Enter 6-digit backup code</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={TEXT_3}
            className="font-mono"
            style={{ flex: 1, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: TEXT_0, fontSize: 18, letterSpacing: 6 }}
          />
          <Pressable onPress={submitCode} disabled={code.length < 6 || checkIn.isPending}
            style={{ paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: code.length === 6 ? TEXT_0 : SURFACE }}>
            <Text className="font-outfit" style={{ color: code.length === 6 ? ORANGE_INK : TEXT_3, fontWeight: '700', fontSize: 14 }}>Check in</Text>
          </Pressable>
        </View>
        {feedback ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: feedback.ok ? GREEN_SOFT : 'rgba(239,68,68,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={13} color={feedback.ok ? GREEN : DANGER} />
            </View>
            <Text className="font-outfit" style={{ color: feedback.ok ? GREEN : DANGER, fontSize: 13 }}>{feedback.msg}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search attendees by name"
          placeholderTextColor={TEXT_3}
          className="font-outfit"
          style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, color: TEXT_0, fontSize: 13.5 }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#FF6B35" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r._id}
          contentContainerStyle={{ paddingTop: 8 }}
          ListEmptyComponent={<Text className="font-outfit" style={{ color: TEXT_2, textAlign: 'center', marginTop: 24, fontSize: 13 }}>No attendees match.</Text>}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderColor: HAIRLINE }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 14, fontWeight: '600' }}>{item.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-outfit" style={{ color: TEXT_0, fontSize: 13.5, fontWeight: '600' }}>{item.name}</Text>
                {item.city ? <Text className="font-outfit" style={{ color: TEXT_2, fontSize: 11.5 }}>{item.city}</Text> : null}
              </View>
              <Text className="font-mono" style={{ color: item.status === 'attended' ? GREEN : TEXT_3, fontSize: 10, textTransform: 'uppercase' }}>{item.status === 'attended' ? 'checked in' : item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
