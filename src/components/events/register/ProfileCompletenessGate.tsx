import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

const TEXT_0 = '#f4f4f5'; const TEXT_1 = '#a1a1aa'; const TEXT_3 = '#52525b'; const SURFACE = 'rgba(255,255,255,0.04)'; const HAIRLINE_2 = 'rgba(255,255,255,0.1)'; const ORANGE_INK = '#1A0D06';

export function ProfileCompletenessGate({ initialName, onComplete }: { initialName?: string; onComplete: (v: { fullName: string; phone: string }) => void }) {
  const [fullName, setFullName] = useState(initialName ?? '');
  const [phone, setPhone] = useState('');
  const valid = fullName.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10;

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b', padding: 20 }}>
      <Text className="font-mono" style={{ color: '#FF6B35', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12 }}>One last thing</Text>
      <Text className="font-serif" style={{ color: TEXT_0, fontSize: 26, lineHeight: 29, marginBottom: 10 }}>Tell us who's coming.</Text>
      <Text className="font-outfit" style={{ color: TEXT_1, fontSize: 14, lineHeight: 22, marginBottom: 24 }}>Hosts need a name on the door and a number if plans change.</Text>
      <Text className="font-mono" style={{ color: TEXT_3, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 }}>Full name</Text>
      <TextInput value={fullName} onChangeText={setFullName} placeholder="Aditi Rao" placeholderTextColor={TEXT_3}
        style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2, borderRadius: 9, padding: 11, color: TEXT_0, fontSize: 13.5, marginBottom: 14 }} />
      <Text className="font-mono" style={{ color: TEXT_3, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 }}>Phone (for reminders)</Text>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor={TEXT_3}
        style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2, borderRadius: 9, padding: 11, color: TEXT_0, fontSize: 13.5, marginBottom: 18 }} />
      <Pressable disabled={!valid} onPress={() => onComplete({ fullName: fullName.trim(), phone })}
        style={{ height: 48, backgroundColor: valid ? TEXT_0 : SURFACE, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="font-outfit" style={{ color: valid ? ORANGE_INK : TEXT_3, fontWeight: '700', fontSize: 14 }}>Continue</Text>
      </Pressable>
      <Text className="font-outfit" style={{ color: TEXT_3, fontSize: 11.5, textAlign: 'center', marginTop: 12 }}>Stored under DPDP. Edit anytime.</Text>
    </View>
  );
}
