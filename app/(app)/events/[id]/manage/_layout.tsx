import { Stack } from 'expo-router';

/**
 * Manage flow navigator — a Stack (no bottom tab bar).
 *
 * Overview is the entry (reached via <Redirect> from the host's event detail) and
 * is the A·Minimal host hub; Settings/Requests are A·Minimal too. The transition
 * backdrop is the #121216 canvas so pushing between them doesn't flash the older
 * palette. Each screen renders its own in-screen header (back + title), so the
 * native header + bottom bar are both off here.
 */
export default function ManageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#121216' },
      }}
    />
  );
}
