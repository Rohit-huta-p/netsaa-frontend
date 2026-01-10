// netsa-mobile/src/components/Navbar.tsx
import React from "react";
import {
    View,
    Text,
    Pressable,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useRouter, usePathname } from "expo-router";
import useAuthStore from "../stores/authStore";
import { useLogout } from "../hooks/useAuthQueries";
import { Bell, Search, Briefcase, Calendar, Users, User, Home } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { usePlatform } from "@/utils/platform";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Props = {
    title?: string;
    left?: React.ReactNode;
    right?: React.ReactNode;
    transparent?: boolean;
};

export default function Navbar({
    title = "Netsa",
    left,
    right,
    transparent,
}: Props) {
    const { user } = useAuthStore();
    const logoutMutation = useLogout();
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    // Search State
    const [inputValue, setInputValue] = React.useState("");
    const debouncedQuery = useDebouncedValue(inputValue, 500);

    const insets = useSafeAreaInsets();
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();

    const isNarrow = width < 720;

    // Effect: Trigger Search API (Navigation/Params)
    React.useEffect(() => {
        if (debouncedQuery.trim().length >= 2) {
            // Check if we are already on search page
            if (pathname.includes('/search')) {
                router.setParams({ q: debouncedQuery.trim() });
            } else {
                router.push({
                    pathname: "/(app)/search",
                    params: { q: debouncedQuery.trim() }
                });
            }
        }
    }, [debouncedQuery]); // Only trigger when debounced value changes

    // Optional: clear input if navigating away? 
    // For now, let's keep it simple as requested.

    const handleLogout = async () => {
        console.log("Logging out");
        // setIsDropdownOpen(false);
        logoutMutation.mutate();
    };

    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name.charAt(0).toUpperCase();
    };

    const displayName = user?.firstName || "User";

    const { isWeb } = usePlatform();
    // Re-declare router to ensure we have it (already declared above but ensuring strict usage)

    // Bottom Tab Config
    const links = [
        { name: 'Gigs', href: '/(app)/gigs', icon: Briefcase },
        { name: 'Events', href: '/(app)/events', icon: Calendar },
        { name: 'Network', href: '/(app)/network', icon: Users },
        { name: 'Profile', href: '/(app)/profile', icon: User },
    ];

    if (!isWeb) {
        return (
            <>
                {/* Mobile Top Navbar - In Flow */}
                <View style={{ paddingTop: insets.top }} className={`z-50 ${transparent ? "" : "bg-netsa-navbar border-b border-white/10"}`}>
                    <View className="h-14 flex-row items-center px-4 justify-between">
                        {/* Profile/User Icon (Left) */}
                        {user ? (
                            <Pressable onPress={() => router.push("/(app)/profile")}>
                                <View className="h-9 w-9 rounded-full bg-netsa-accent-purple items-center justify-center">
                                    <Text className="text-white font-bold text-lg font-satoshi-bold">{getInitials(user?.firstName)}</Text>
                                </View>
                            </Pressable>
                        ) : (
                            // Logo when logged out
                            <LinearGradient
                                colors={["#ff7ab6", "#ffb86b"]}
                                start={[0, 0]}
                                end={[1, 1]}
                                className="h-9 w-9 rounded-full items-center justify-center"
                                style={{ overflow: "hidden" }}
                            >
                                <Text className="text-white font-bold font-satoshi-black">N</Text>
                            </LinearGradient>
                        )}

                        {/* Search Bar */}
                        <View
                            className="flex-row items-center px-3 h-10 rounded-full border border-white/10 bg-white/10 flex-1 mx-3"
                        >
                            <Search width={18} height={18} color="#9A9AA3" />
                            <TextInput
                                value={inputValue}
                                onChangeText={setInputValue}
                                // Removed onSubmitEditing since we rely on debounce
                                placeholder="Search"
                                placeholderTextColor="#9A9AA3"
                                returnKeyType="search"
                                className="ml-2 flex-1 text-sm h-full py-0 outline-none text-white font-inter"
                            />
                        </View>

                        {/* Right Actions: Notifications + Logout OR Login/Signup */}
                        {user ? (
                            <View className="flex-row items-center">
                                <Link href="/(app)/notifications" asChild>
                                    <Pressable className="p-2">
                                        <Bell size={24} color="#C9C9D1" />
                                    </Pressable>
                                </Link>
                                {user.role === "organizer" && <Link href="/dashboard" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-netsa-text-primary font-bold text-xs font-satoshi-bold">Dashboard</Text>
                                    </TouchableOpacity>
                                </Link>}
                                <Pressable onPress={handleLogout} className="px-2 py-2 ml-1">
                                    <Text className="text-netsa-accent-red font-medium text-xs font-inter-medium">Log Out</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-3">
                                <Link href="/(auth)/login" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-netsa-text-primary font-bold text-xs font-satoshi-bold">Log In</Text>
                                    </TouchableOpacity>
                                </Link>
                                <Link href="/(auth)/register" asChild>
                                    <TouchableOpacity className="bg-white px-3 py-1.5 rounded-full">
                                        <Text className="text-black font-bold text-xs font-satoshi-bold">Sign Up</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        )}
                    </View>
                </View>

                {/* Mobile Bottom Navbar - Overlay */}
                <View
                    className="absolute left-0 right-0 top-0 bottom-0 z-50"
                    pointerEvents="box-none"
                >
                    <View className="flex-1" pointerEvents="none" />
                    <View
                        className="bg-netsa-navbar border-t border-white/10 flex-row justify-around items-center pt-3 pb-6"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                        pointerEvents="auto"
                    >
                        {links.map((link) => {
                            const Icon = link.icon;
                            // Check if active? No easy way here without route checking, keeping simple
                            return (
                                <Link key={link.name} href={link.href as any} asChild>
                                    <TouchableOpacity className="items-center justify-center w-16">
                                        <Icon size={24} color="#C9C9D1" strokeWidth={1.5} />
                                        <Text className="text-[10px] text-netsa-text-muted font-medium mt-1 font-inter">{link.name}</Text>
                                    </TouchableOpacity>
                                </Link>
                            )
                        })}
                    </View>
                </View>
            </>
        );
    }

    return (
        <View style={{ paddingTop: insets.top }} className={`z-50 ${transparent ? "" : "bg-netsa-navbar border-b border-white/10"}`}>
            <View className="h-16 flex-row items-center px-3">
                {/* LEFT */}
                <View className="flex-row items-center space-x-3">
                    <Link href="/" asChild>
                        <Pressable className="flex-row items-center">
                            <LinearGradient
                                colors={["#ff7ab6", "#ffb86b"]}
                                start={[0, 0]}
                                end={[1, 1]}
                                className="h-9 w-9 rounded-full items-center justify-center"
                                style={{ overflow: "hidden" }}
                            >
                                <Text className="text-white font-bold font-satoshi-black">N</Text>
                            </LinearGradient>

                            <Text className="ml-2 text-lg font-extrabold text-white font-satoshi-black">Netsa</Text>
                        </Pressable>
                    </Link>

                    {/* Nav links - only show on wide screens */}
                    {!isNarrow && (
                        <View className="flex-row items-center space-x-3 ml-2">
                            <Link href="/(app)/gigs" asChild>
                                <Pressable className="px-2 py-1">
                                    <Text className="text-sm font-medium text-netsa-text-secondary hover:text-white font-inter-medium">Gigs</Text>
                                </Pressable>
                            </Link>
                            <Link href="/(app)/events" asChild>
                                <Pressable className="px-2 py-1">
                                    <Text className="text-sm font-medium text-netsa-text-secondary hover:text-white font-inter-medium">Events</Text>
                                </Pressable>
                            </Link>
                            <Link href="/(app)/connections" asChild>
                                <Pressable className="px-2 py-1">
                                    <Text className="text-sm font-medium text-netsa-text-secondary hover:text-white font-inter-medium">Connections</Text>
                                </Pressable>
                            </Link>
                        </View>
                    )}
                </View>

                {/* CENTER: Search */}
                <View className="flex-1 items-center px-3">
                    <View
                        className={`
              flex-row items-center px-4 h-10 rounded-full border
              ${isNarrow ? "max-w-[420px]" : "max-w-[720px]"} w-full
              border-white/10 bg-white/10
            `}
                    >
                        <Search width={18} height={18} color="#9A9AA3" />
                        <TextInput
                            value={inputValue}
                            onChangeText={setInputValue}
                            // Removed manual submit, relying on debounce effect
                            placeholder="Search events, artists, workshops..."
                            placeholderTextColor="#9A9AA3"
                            returnKeyType="search"
                            className="ml-3 flex-1 text-sm h-full py-0 outline-none text-white font-inter"
                        />
                    </View>
                </View>

                {/* RIGHT */}
                <View className="flex-row items-center space-x-3">
                    <Link href="/(app)/notifications" asChild>
                        <TouchableOpacity className="relative p-2">
                            <Bell width={20} height={20} color="#C9C9D1" />
                            <View className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-netsa-accent-red" />
                        </TouchableOpacity>
                    </Link>

                    {user ? (
                        <View className="relative">
                            <Pressable
                                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="h-10 w-10 rounded-full overflow-visible"
                            >
                                <View className="h-10 w-10 flex items-center justify-center rounded-full bg-netsa-accent-purple">
                                    <Text className="text-white font-bold font-satoshi-bold">{getInitials(displayName)}</Text>
                                </View>

                                <View className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-netsa-navbar bg-netsa-accent-red" />
                            </Pressable>

                            {/* Dropdown */}
                            {isDropdownOpen && (
                                <View className="absolute top-12 right-0 w-48 bg-netsa-card rounded-xl border border-white/10 overflow-hidden shadow-lg z-50">
                                    <View className="px-4 py-3 border-b border-white/5 bg-white/5">
                                        <Text className="font-semibold text-white truncate font-satoshi-medium">{displayName}</Text>
                                        <Text className="text-xs text-gray-400 truncate font-inter">{user.email}</Text>
                                    </View>

                                    <Link href="/(app)/profile" asChild>
                                        <Pressable onPress={() => setIsDropdownOpen(false)} className="px-4 py-3 active:bg-white/5">
                                            <Text className="text-netsa-text-secondary font-inter">Profile</Text>
                                        </Pressable>
                                    </Link>

                                    <Pressable onPress={handleLogout} className="px-4 py-3 border-t border-white/5 active:bg-white/5">
                                        <Text className="text-netsa-accent-red font-medium font-inter-medium">Log Out</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View className="flex-row items-center gap-2">
                            <Link href="/(auth)/login" asChild>
                                <Pressable className="px-4 py-2">
                                    <Text className="font-semibold text-white font-satoshi-medium">Log In</Text>
                                </Pressable>
                            </Link>
                            <Link href="/(auth)/register" asChild>
                                <Pressable className="px-4 py-2 bg-white rounded-full">
                                    <Text className="font-semibold text-black font-satoshi-bold">Sign Up</Text>
                                </Pressable>
                            </Link>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
