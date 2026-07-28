// app/(app)/inbox/index.tsx
// Unified Inbox — one route for messaging. The Messages·Invites launcher (InboxLauncher)
// is the entry; opening a conversation adds ?c=<id> to this same route.
//   • Desktop (>=900): 2-pane — launcher (left) + ChatWindow (right), or an empty state.
//   • Mobile  (<900):  launcher full-screen, or ChatWindow full-screen when ?c= is set.
// Replaces the retired /messages screen; all callers now deep-link to /inbox?c=<id>.
import { View, Text, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import InboxLauncher from '@/components/inbox/InboxLauncher';
import { ChatWindow } from '@/components/connections/ChatWindow';

const DESKTOP_BREAKPOINT = 900;

// Desktop right-pane empty state, in the inbox design system.
function EmptyChat() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#3f3f46', fontSize: 44, marginBottom: 14 }}>✦</Text>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 21, marginBottom: 6 }}>Pick a conversation</Text>
            <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 13, textAlign: 'center' }}>
                Choose a message on the left to start chatting.
            </Text>
        </View>
    );
}

export default function InboxScreen() {
    const router = useRouter();
    const { c } = useLocalSearchParams<{ c?: string }>();
    const { width } = useWindowDimensions();
    const isDesktop = width >= DESKTOP_BREAKPOINT;
    const activeId = (c as string) || undefined;

    const openConversation = (id: string) => router.setParams({ c: id });
    const closeChat = () => router.setParams({ c: undefined as any });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            {isDesktop ? (
                // ── Desktop: 2-pane frame ──
                <View style={{ flex: 1, minHeight: 0, backgroundColor: '#09090b' }}>
                    <SafeAreaView edges={['top']} style={{ flex: 1, minHeight: 0 }}>
                        <View
                            style={{
                                flex: 1,
                                minHeight: 0,
                                flexDirection: 'row',
                                maxWidth: 1400,
                                width: '100%',
                                alignSelf: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.08)',
                                borderRadius: 14,
                                overflow: 'hidden',
                                marginVertical: 14,
                                marginHorizontal: 14,
                            }}
                        >
                            <View style={{ width: 360, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' }}>
                                <InboxLauncher activeId={activeId} onSelectConversation={openConversation} hideBack />
                            </View>
                            <View style={{ flex: 1, minHeight: 0, backgroundColor: '#09090b' }}>
                                {activeId ? (
                                    <ChatWindow conversationId={activeId} onClose={closeChat} hideClose />
                                ) : (
                                    <EmptyChat />
                                )}
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            ) : activeId ? (
                // ── Mobile: full-screen chat ──
                <SafeAreaView edges={['top']} style={{ flex: 1, minHeight: 0, backgroundColor: '#09090b' }}>
                    <ChatWindow conversationId={activeId} onClose={closeChat} />
                </SafeAreaView>
            ) : (
                // ── Mobile: full-screen launcher (self-manages its top spacing) ──
                <InboxLauncher onSelectConversation={openConversation} />
            )}
        </>
    );
}
