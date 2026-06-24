/**
 * /events/[id]/registered — Receipt / "your registration" screen.
 *
 * Renders the same RegistrationReceiptCard that pops after a successful
 * register, but in "view" mode. Lets users come back later to find the
 * order ID or refund policy without re-opening the register sheet.
 *
 * Deep-link-friendly: a push notification or email can link directly here.
 *
 * Edge cases:
 *   - Not registered → redirect to /events/[id]
 *   - Event not found → show "Not found" state
 *   - Loading → activity indicator
 */
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEvent } from '@/hooks/useEvents';
import { useMyRegistration } from '@/hooks/useMyRegistration';
import { eventTokens } from '@/lib/eventTokens';
import RegistrationReceiptCard from '@/components/events/register/RegistrationReceiptCard';

export default function RegisteredScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { data: event, isLoading: eventLoading } = useEvent(id ?? '');
    const { data: registration, isLoading: regLoading } = useMyRegistration(id ?? '');

    if (eventLoading || regLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: eventTokens.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={eventTokens.brand} />
            </View>
        );
    }

    if (!event) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: eventTokens.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                }}
            >
                <Text className="font-serif text-event-textPrimary text-2xl">Event not found</Text>
                <Pressable onPress={() => router.back()} className="mt-6 rounded-2xl bg-event-surface px-8 py-3 border border-event-border">
                    <Text className="font-outfit text-event-textPrimary">Go back</Text>
                </Pressable>
            </View>
        );
    }

    // Not registered → fall back to the event detail page so the user can
    // register, instead of showing an empty receipt.
    if (registration === null) {
        return <Redirect href={`/events/${id}`} />;
    }

    if (!registration) {
        return (
            <View style={{ flex: 1, backgroundColor: eventTokens.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={eventTokens.brand} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: eventTokens.bg }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Back row */}
            <View className="pt-12 pb-2 px-4 flex-row items-center">
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    className="w-10 h-10 rounded-full items-center justify-center bg-event-surface border border-event-border"
                >
                    <ChevronLeft size={20} color={eventTokens.textPrimary} />
                </Pressable>
            </View>

            <RegistrationReceiptCard
                event={event}
                registration={registration}
                variant="view"
                onViewEvent={() => router.replace(`/events/${id}`)}
                onDismiss={() => router.back()}
            />
        </ScrollView>
    );
}
