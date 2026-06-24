import { Redirect } from "expo-router";

export default function Index() {
  // Default page when accessing /(app) route → role-dispatched home
  // (dashboard picks /client, artist-home, or hirer-home off user.role).
  return <Redirect href="/(app)/dashboard" />;
}
