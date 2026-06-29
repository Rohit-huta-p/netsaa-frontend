import { Stack } from 'expo-router';
import { eventTokens } from '@/lib/eventTokens';

/**
 * Manage flow navigator — a Stack (no bottom tab bar).
 *
 * Overview is the entry (reached via <Redirect> from the host's event detail);
 * Roster and Check-in are pushed from the Overview quick actions. Each screen
 * renders its own in-screen header (back + title) per the O4–O8 mockups, so
 * headers + the bottom bar are both off here.
 */
export default function ManageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: eventTokens.bg },
      }}
    />
  );
}
