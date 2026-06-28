import { useLocalSearchParams } from 'expo-router';
import CheckInScannerScreen from '@/components/events/manage/CheckInScannerScreen';
import { ManualCheckInList } from '@/components/events/manage/ManualCheckInList';

export default function CheckInRoute() {
  const { manual } = useLocalSearchParams<{ manual?: string }>();
  return manual === '1' ? <ManualCheckInList /> : <CheckInScannerScreen />;
}
