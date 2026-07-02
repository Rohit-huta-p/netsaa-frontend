import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import RosterList from '@/components/events/manage/RosterList';
import { useEvent } from '@/hooks/useEvents';
import WalkupAddSheet from '@/components/events/manage/WalkupAddSheet';

export default function RosterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event } = useEvent(id);
  const [walkupOpen, setWalkupOpen] = useState(false);
  const remaining = event ? (event.capacity?.slotsLeft ?? ((event.capacity?.total ?? 0) - (event.capacity?.registeredCount ?? 0))) : 0;
  const canWalkup = !!event?.walkupsAllowed && remaining > 0;

  return (
    <View style={styles.screen}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to overview">
          <ChevronLeft size={18} color="#F3EFE8" />
        </Pressable>
        <Text style={styles.title}>Roster</Text>
        {canWalkup ? (
          <Pressable onPress={() => setWalkupOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Add walk-up">
            <Text style={styles.addWalkup}>+ Add walk-up</Text>
          </Pressable>
        ) : null}
      </View>
      <RosterList eventId={id} />
      {event && canWalkup ? (
        <WalkupAddSheet visible={walkupOpen} event={event} remaining={remaining} onClose={() => setWalkupOpen(false)} onAdded={() => setWalkupOpen(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060509' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: 'DMSerifDisplay_400Regular', color: '#F3EFE8', fontSize: 20 },
  addWalkup: { fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 13 },
});
