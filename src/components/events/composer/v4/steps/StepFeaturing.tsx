import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Send, X, Check } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { presetFor } from '../eventTypePresets';
import { Group, Hint } from '../ui';
import InviteSheetV4 from '../InviteSheetV4';
import PeopleSearchFieldV4, { PickedPerson } from '../PeopleSearchFieldV4';
import { C, F } from '../theme';

export default function StepFeaturing() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const [invitingIndex, setInvitingIndex] = useState<number | null>(null);
  const preset = presetFor(form.eventType);

  // Pick a real NETSA profile from search → has userId, no invite needed.
  const addPersonPicked = (p: PickedPerson) => {
    if (!p.userId || form.people.some((x) => x.userId === p.userId)) return;
    update('people', [...form.people, { userId: p.userId, displayName: p.displayName, avatarUrl: p.avatarUrl, role: preset.peopleRole, invited: false }]);
  };
  // A typed name not on NETSA is a plain-text person, NOT yet invited — the host
  // sends an invite from the chip's ✈ (opens InviteSheetV4), which flips invited=true.
  const addPersonPlain = (name: string) => {
    const n = name.trim();
    if (n) update('people', [...form.people, { displayName: n, role: preset.peopleRole, invited: false }]);
  };
  const removePerson = (i: number) => update('people', form.people.filter((_, k) => k !== i));
  const markInvited = (i: number) => update('people', form.people.map((p, k) => (k === i ? { ...p, invited: true } : p)));

  return (
    <View>
      <Text style={st.sub}>Add anyone attendees should know about — teachers, performers, special guests. Optional, and each person gets a role.</Text>

      <Group label="Featuring" optional>
        <View style={st.people}>
          {form.people.map((p, i) => (
            <View key={i} style={st.person}>
              {p.avatarUrl ? <Image source={{ uri: p.avatarUrl }} style={st.personAvatar} /> : null}
              <Text style={st.personName}>{p.displayName}</Text>
              <Text style={st.personRole}>{p.role}</Text>
              {p.userId ? null : p.invited ? (
                <View style={st.invitedPill}>
                  <Check size={10} color={C.green} strokeWidth={2.8} />
                  <Text style={st.invitedTxt}>Invited</Text>
                </View>
              ) : (
                <Pressable onPress={() => setInvitingIndex(i)} hitSlop={6} style={st.inviteBtn} accessibilityLabel={`Invite ${p.displayName}`}>
                  <Send size={12} color={C.orange} />
                </Pressable>
              )}
              <Pressable onPress={() => removePerson(i)} hitSlop={6} accessibilityLabel={`Remove ${p.displayName}`}>
                <X size={13} color={C.dim2} />
              </Pressable>
            </View>
          ))}
        </View>
        <PeopleSearchFieldV4
          roleLabel={preset.peopleRole}
          existingUserIds={new Set(form.people.filter((p) => p.userId).map((p) => p.userId!))}
          onPick={addPersonPicked}
          onAddPlain={addPersonPlain}
        />
        <Hint>Pick someone on NETSA, or add a name and invite them with ✈.</Hint>
      </Group>

      <InviteSheetV4
        person={invitingIndex != null ? form.people[invitingIndex] ?? null : null}
        onClose={() => setInvitingIndex(null)}
        onShared={() => { if (invitingIndex != null) markInvited(invitingIndex); }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1B1B24', borderWidth: 1, borderColor: C.border2 },
  personName: { fontFamily: F.semibold, fontSize: 12, color: C.t3 },
  personRole: { fontFamily: F.bold, fontSize: 9.5, color: C.t4, backgroundColor: '#2A2A34', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  invitedPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.greenSoft, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  invitedTxt: { fontFamily: F.bold, fontSize: 9.5, color: C.green },
  inviteBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  personAvatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.well, marginRight: -2 },
});
