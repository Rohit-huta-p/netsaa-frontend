// src/components/gigs/detail/GigHeaderBlock.tsx
// Top bar + identity (avatar · title · producer·city · urgency · save) + facet chips.

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, Share2, Bookmark, Clock } from 'lucide-react-native';
import { C, F, IconBtn, Avatar, Chip } from './ui';
import type { GigDetailVM } from './gigDetailVM';

export function GigHeaderBlock({
  vm,
  onBack,
  onShare,
  onToggleSave,
  saved,
}: {
  vm: GigDetailVM;
  onBack?: () => void;
  onShare: () => void;
  onToggleSave: () => void;
  saved: boolean;
}) {
  const urgencyBits = [
    vm.appliedCount > 0 ? `${vm.appliedCount} applied` : null,
    vm.deadlineLabel ? vm.deadlineLabel : null,
  ].filter(Boolean);

  return (
    <View>
      {/* top bar */}
      <View style={s.topbar}>
        <IconBtn label="Back" onPress={onBack}>
          <ChevronLeft size={18} color={C.t2} />
        </IconBtn>
        <Text style={s.htitle}>Gig detail</Text>
        <IconBtn label="Share this gig" onPress={onShare}>
          <Share2 size={16} color={C.t2} />
        </IconBtn>
      </View>

      {/* identity */}
      <View style={s.identity}>
        <Avatar url={vm.avatarUrl} initials={vm.initials} size={56} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title}>{vm.title}</Text>
          {!!vm.producerLine && <Text style={s.meta}>{vm.producerLine}</Text>}
          {urgencyBits.length > 0 && (
            <View style={s.urg}>
              <Clock size={11} color={C.amber} />
              <Text style={s.urgTxt}>{urgencyBits.join(' · ').toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={onToggleSave} accessibilityRole="button" accessibilityLabel={saved ? 'Remove from saved' : 'Save gig'} hitSlop={8} style={{ marginTop: 2 }}>
          <Bookmark size={21} color={saved ? C.orange : C.t4} fill={saved ? C.orange : 'none'} />
        </Pressable>
      </View>

      {/* facet chips */}
      {(vm.facets.length > 0 || vm.overflow > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {vm.facets.map((f, i) => (
            <Chip key={`${f}-${i}`}>{f}</Chip>
          ))}
          {vm.overflow > 0 && <Chip muted>{`+${vm.overflow}`}</Chip>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 },
  htitle: { fontFamily: F.semi, fontSize: 16, color: C.t1 },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8 },
  title: { fontFamily: F.bold, fontSize: 20, color: C.t1, letterSpacing: -0.4, lineHeight: 24 },
  meta: { fontFamily: F.reg, fontSize: 13, color: C.t4, marginTop: 5 },
  urg: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  urgTxt: { fontFamily: F.semi, fontSize: 9.5, letterSpacing: 0.6, color: C.amber },
  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 2 },
});
