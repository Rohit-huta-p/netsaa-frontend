/**
 * Manage · Requests — host review of pending guest_list / apply registration
 * requests (§6a-c/d/e, the A·Minimal "Requests" surface parked as frame 11 of
 * the Manage-Event redesign until the backend pending-status shipped).
 *
 * Pushed from the overview's Backstage "Review requests" row, which only shows
 * for an approval-gated door. Headerless Stack → this screen draws its own nav.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import RequestsList from '@/components/events/manage/RequestsList';

export default function RequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace(`/events/${id}/manage/overview` as any))}
          hitSlop={8}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Back to overview"
        >
          <ChevronLeft size={18} color="#F3EFE8" />
        </Pressable>
        <Text style={styles.title}>Requests</Text>
      </View>
      <RequestsList eventId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#121216' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: 'DMSerifDisplay_400Regular', color: '#F3EFE8', fontSize: 20 },
});
