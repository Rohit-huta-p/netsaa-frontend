// app/(app)/saved/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import { Heart, Calendar, MapPin, Users, Sparkles, Clock, ArrowRight, TrendingUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSavedItems, SavedItem } from "../../../src/hooks/useSavedItems";
import AppScrollView from '@/components/AppScrollView';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { useRouter } from "expo-router";

const isWeb = Platform.OS === 'web';

export default function SavedJobsScreen() {
  const [activeTab, setActiveTab] = useState("Saved");
  const { savedItems, appliedItems, upcomingItems, historyItems, isLoading, refetchAll, counts } = useSavedItems();
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  // Get data based on active tab
  const getTabData = (): SavedItem[] => {
    switch (activeTab) {
      case "Saved":
        return savedItems;
      case "Applied":
        return appliedItems;
      case "Upcoming":
        return upcomingItems;
      case "History":
        return historyItems;
      default:
        return [];
    }
  };

  const TABS = [
    { key: "Saved", count: counts.saved },
    { key: "Applied", count: counts.applied },
    { key: "Upcoming", count: counts.upcoming },
    { key: "History", count: counts.history },
  ];

  const renderItem = ({ item }: { item: SavedItem }) => (
    <View className="mb-6">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (item.type === 'GIG') router.push(`/gigs/${item.id}`);
          else if (item.type === 'EVENT') router.push(`/events/${item.id}`);
        }}
        className="group bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden"
      >
        <View className="p-5">
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-row items-center gap-3">
              <LinearGradient
                colors={item.imageGradient || ['#3B82F6', '#2563EB']}
                className="w-12 h-12 rounded-xl items-center justify-center opacity-90"
              >
                <Text className="text-xl">{item.icon}</Text>
              </LinearGradient>
              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">
                  {item.type}
                </Text>
                <Text
                  className="text-lg font-bold text-white leading-tight"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </View>
            </View>

            <TouchableOpacity className="bg-zinc-800/50 p-2 rounded-full">
              <Heart size={18} color="#ef4444" fill="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Meta Info */}
          <View className="space-y-2 mb-4">
            <View className="flex-row items-center gap-2">
              <Calendar size={14} color="#71717a" />
              <Text className="text-xs text-zinc-400 font-medium">
                {item.date}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <MapPin size={14} color="#71717a" />
              <Text className="text-xs text-zinc-400 font-medium">
                {item.location}
              </Text>
            </View>
          </View>

          {/* Footer Strip */}
          <View className="pt-4 border-t border-white/5 flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Users size={12} color="#71717a" />
              <Text className="text-xs text-zinc-500">
                <Text className="text-zinc-300 font-bold">{item.attending}</Text> interested
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
              <Clock size={10} color="#f87171" />
              <Text className="text-[10px] text-red-400 font-bold">
                EXP: {item.expiresOn}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      {/* Spotlight Effect - Matching Gigs/[id] & Index */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          width: width,
          left: 0,
          overflow: 'hidden',
          height: height * 0.4,
          pointerEvents: 'none',
        }}
      >
        <LinearGradient
          colors={[
            'rgba(168, 85, 247, 0.15)', // Purple tint for "Saved"
            'rgba(236, 72, 153, 0.05)', // Pink secondary
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <AppScrollView className="flex-1">
        {/* HERO SECTION - COMPACT */}
        <View className="pt-32 pb-8 px-6 border-b border-white/5">
          <View className="container mx-auto max-w-7xl">
            <View className="flex-row items-end justify-between mb-8">
              <View className="flex-1 max-w-2xl">
                <View className="flex-row items-center gap-2 mb-4">
                  <Sparkles size={14} color="#F472B6" />
                  <Text className="text-pink-400 text-xs font-bold uppercase tracking-widest">
                    Your Collection
                  </Text>
                </View>
                <Text className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">
                  SAVED ITEMS.
                </Text>
                <Text className="text-xl text-zinc-500 font-light">
                  Track, manage, and apply to your favorite <Text className="text-zinc-300">opportunities</Text>.
                </Text>
              </View>
            </View>

            {/* TABS - Horizontal Scroll */}
            <View className="w-full">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      activeOpacity={0.8}
                      className={`flex-row items-center px-6 py-3 rounded-2xl border ${isActive
                          ? 'bg-zinc-100 border-zinc-100'
                          : 'bg-zinc-900/50 border-white/10'
                        }`}
                    >
                      <Text className={`text-sm font-bold mr-2 ${isActive ? 'text-black' : 'text-zinc-400'
                        }`}>
                        {tab.key}
                      </Text>
                      {tab.count > 0 && (
                        <View className={`px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/10' : 'bg-white/10'
                          }`}>
                          <Text className={`text-[10px] font-black ${isActive ? 'text-black' : 'text-zinc-300'
                            }`}>
                            {tab.count}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* LIST SECTION */}
        <View className="flex-1 px-6 py-8">
          <View className="container mx-auto max-w-7xl">
            {isLoading ? (
              <View className="flex-1 justify-center items-center py-20">
                <LoadingAnimation
                  source="https://lottie.host/ecebcd4d-d1c9-4e57-915f-d3f61705a717/VFWGhqMAX0.lottie"
                  width={200}
                  height={200}
                />
                <Text className="text-zinc-500 mt-4 text-xs font-medium">
                  Loading your collection...
                </Text>
              </View>
            ) : getTabData().length === 0 ? (
              <View className="flex-1 justify-center items-center py-20 px-8">
                <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-zinc-900 border border-white/5">
                  <Sparkles size={32} color="#71717A" />
                </View>
                <Text className="text-white font-bold text-xl text-center mb-2">No items yet</Text>
                <Text className="text-zinc-500 text-center font-light max-w-xs">
                  {activeTab === "Saved" && "Start exploring and save events or gigs to see them here."}
                  {activeTab === "Applied" && "Track your applications here once you apply to gigs."}
                  {activeTab === "Upcoming" && "Your registered events will appear here."}
                  {activeTab === "History" && "Past events you've attended will be archived here."}
                </Text>
                <TouchableOpacity
                  className="mt-8 bg-white px-8 py-3 rounded-full flex-row items-center gap-2"
                  onPress={() => router.push('/gigs')}
                >
                  <Text className="text-black font-bold">Discover Opportunities</Text>
                  <ArrowRight size={16} color="#000" />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.3em]">
                    {getTabData().length} {getTabData().length === 1 ? 'Item' : 'Items'}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <TrendingUp size={12} color="#3B82F6" />
                    <Text className="text-blue-400 text-[10px] font-black uppercase">
                      Last Updated
                    </Text>
                  </View>
                </View>

                {getTabData().map((item) => (
                  <React.Fragment key={item.id}>
                    {renderItem({ item })}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        </View>
      </AppScrollView>
    </View>
  );
}