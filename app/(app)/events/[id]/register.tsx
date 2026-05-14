import { useLocalSearchParams, Redirect } from 'expo-router';

export default function LegacyRegisterRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/events/${id}?openRegister=1`} />;
}
