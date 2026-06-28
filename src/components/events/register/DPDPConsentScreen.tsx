import { View, Text, Pressable } from 'react-native';

const TEXT_0 = '#f4f4f5'; const TEXT_1 = '#a1a1aa'; const GREEN = '#22C55E'; const GREEN_SOFT = 'rgba(34,197,94,0.14)'; const ORANGE_INK = '#1A0D06';

const POINTS = [
  'Encrypted at rest · purged 12 months after the event',
  'Only the host sees your name + phone · never email',
  'Delete anytime from Settings → Privacy',
];

export function DPDPConsentScreen({ onAgree, onClose }: { onAgree: () => void; onClose: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b', padding: 20 }}>
      <Text className="font-mono" style={{ color: '#52525b', fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600', marginBottom: 10 }}>DPDP · 2026</Text>
      <Text className="font-serif" style={{ color: TEXT_0, fontSize: 24, lineHeight: 27, marginBottom: 14 }}>How we hold your data.</Text>
      <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 13.5, lineHeight: 21, marginBottom: 18 }}>
        When you register, we share your name and phone with the host so they can welcome you and let you know if plans change.
      </Text>
      {POINTS.map((p) => (
        <View key={p} style={{ flexDirection: 'row', gap: 11, paddingVertical: 10 }}>
          <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: GREEN, fontSize: 12 }}>✓</Text>
          </View>
          <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 12.5, lineHeight: 18, flex: 1 }}>{p}</Text>
        </View>
      ))}
      <Pressable onPress={onAgree} style={{ height: 48, backgroundColor: TEXT_0, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
        <Text className="font-outfit" style={{ color: ORANGE_INK, fontWeight: '700', fontSize: 14 }}>I agree</Text>
      </Pressable>
      <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Text className="font-outfit" style={{ color: '#71717a', fontSize: 12 }}>Not now</Text>
      </Pressable>
    </View>
  );
}
