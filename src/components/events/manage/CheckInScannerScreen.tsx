import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCheckIn } from '@/hooks/useEvents';

const BG = '#09090b'; const TEXT_0 = '#f4f4f5'; const TEXT_2 = '#71717a'; const ORANGE = '#FF6B35'; const GREEN_SOFT = 'rgba(34,197,94,0.14)'; const GREEN = '#22C55E';

export default function CheckInScannerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const checkIn = useCheckIn(id);
  const [recent, setRecent] = useState<{ name: string; at: string }[]>([]);
  const [scanning, setScanning] = useState(true);

  const onScan = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    const code = data.split('|')[0]; // ticketCode is first segment
    try {
      const r = await checkIn.mutateAsync({ code, method: 'qr' });
      setRecent((prev) => [{ name: r.attendeeName, at: 'just now' }, ...prev]);
    } catch { /* show toast — already checked in / not found */ }
    setTimeout(() => setScanning(true), 1500);
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text className="font-outfit" style={{ color: TEXT_0, marginBottom: 14 }}>Camera access needed to scan tickets.</Text>
        <Pressable onPress={requestPermission} style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: TEXT_0, borderRadius: 10 }}>
          <Text className="font-outfit" style={{ color: '#1A0D06', fontWeight: '700' }}>Grant access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color={TEXT_0} />
        </Pressable>
        <Text className="font-serif" style={{ color: TEXT_0, fontSize: 20, marginLeft: 12 }}>Check-in</Text>
      </View>
      <View style={{ marginHorizontal: 20, height: 320, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanning ? onScan : undefined} />
      </View>
      <Text className="font-mono" style={{ color: '#52525b', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600', padding: 20 }}>Recently checked in</Text>
      {recent.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: GREEN }}>✓</Text></View>
          <Text className="font-outfit" style={{ color: TEXT_0, fontSize: 13.5, fontWeight: '600', flex: 1 }}>{r.name}</Text>
          <Text className="font-mono" style={{ color: '#52525b', fontSize: 10 }}>{r.at}</Text>
        </View>
      ))}
      <Pressable onPress={() => router.push(`/events/${id}/manage/check-in?manual=1`)} style={{ alignItems: 'center', padding: 16 }}>
        <Text className="font-outfit" style={{ color: ORANGE, fontSize: 13, fontWeight: '600' }}>Can't scan? Manual check-in →</Text>
      </Pressable>
    </View>
  );
}
