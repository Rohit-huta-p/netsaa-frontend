import { Redirect } from "expo-router";

export default function Index() {
  // Default page when accessing /(app) route
  return <Redirect href="/(app)/gigs" />;
}
