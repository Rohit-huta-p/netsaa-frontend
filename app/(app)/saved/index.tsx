// app/(app)/saved/SavedJobsScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Heart, Calendar, MapPin, Users, Sparkles, Clock, ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = [
  { key: "Saved", count: 2 },
  { key: "Applied", count: 1 },
  { key: "Upcoming", count: 0 },
  { key: "History", count: 12 },
];

const DATA = [
  {
    id: "1",
    type: "Workshop",
    title: "Contemporary Flow & Floorwork",
    date: "Dec 15 • 7:00 PM",
    location: "Downtown Studio, NYC",
    attending: 24,
    expiresOn: "2 days",
    imageGradient: ["#ec4899", "#be185d"], // Pink
    icon: "🎭"
  },
  {
    id: "2",
    type: "Audition",
    title: "Music Video Backup Dancers",
    date: "Dec 18 • 10:00 AM",
    location: "Brooklyn Heights",
    attending: 150,
    expiresOn: "Tomorrow",
    imageGradient: ["#8b5cf6", "#6d28d9"], // Purple
    icon: "👟"
  },
];

export default function SavedJobsScreen() {
  const [activeTab, setActiveTab] = useState("Saved");

  const renderItem = ({ item }: any) => (
    <View className="mb-4">
      {/* Glass Container */}
      <View className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">

        <View className="flex-row p-4 gap-4">
          {/* Left: Thumbnail / Icon */}
          <LinearGradient
            colors={item.imageGradient}
            className="w-20 h-24 rounded-2xl items-center justify-center shadow-lg"
          >
            <Text className="text-3xl">{item.icon}</Text>
          </LinearGradient>

          {/* Right: Content */}
          <View className="flex-1 justify-between">
            <View>
              {/* Header Row */}
              <View className="flex-row justify-between items-start mb-1">
                <View className="bg-white/10 px-2 py-1 rounded-md self-start">
                  <Text className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {item.type}
                  </Text>
                </View>
                <TouchableOpacity>
                  <Heart size={18} color="#ef4444" fill="#ef4444" />
                </TouchableOpacity>
              </View>

              <Text className="text-lg font-bold text-white leading-tight mb-1">
                {item.title}
              </Text>
            </View>

            {/* Meta Info */}
            <View className="space-y-1.5">
              <View className="flex-row items-center space-x-2">
                <Calendar size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400 font-medium">
                  {item.date}
                </Text>
              </View>

              <View className="flex-row items-center space-x-2">
                <MapPin size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400 font-medium">
                  {item.location}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Strip */}
        <View className="bg-black/20 px-4 py-3 flex-row justify-between items-center border-t border-white/5">
          <View className="flex-row items-center space-x-2">
            <Users size={12} color="#a1a1aa" />
            <Text className="text-xs text-gray-400">
              <Text className="text-white font-bold">{item.attending}</Text> people going
            </Text>
          </View>

          <View className="flex-row items-center space-x-1.5 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
            <Clock size={10} color="#f87171" />
            <Text className="text-[10px] text-red-400 font-bold">
              Exp: {item.expiresOn}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#09090b]">
      <StatusBar barStyle="light-content" />

      {/* Ambient Background Gradient */}
      <LinearGradient
        colors={["#4c1d95", "#09090b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.3 }}
        className="absolute top-0 left-0 right-0 h-full"
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-2 mb-6">
          <View className="flex-row items-center space-x-2 mb-1">
            <Sparkles size={14} color="#F472B6" />
            <Text className="text-pink-400 text-xs font-bold uppercase tracking-widest">
              Your Collection
            </Text>
          </View>
          <Text className="text-4xl font-black text-white">
            Saved <Text className="text-transparent" style={{ color: '#a855f7' }}>Gigs</Text>
          </Text>
        </View>

        {/* Tabs */}
        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={["#db2777", "#be185d"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="flex-row items-center px-5 py-2.5 rounded-full"
                    >
                      <Text className="text-white font-bold text-sm mr-2">{tab.key}</Text>
                      <View className="bg-white/20 px-1.5 rounded-md">
                        <Text className="text-white text-[10px] font-bold">{tab.count}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View className="flex-row items-center px-5 py-2.5 rounded-full bg-white/5 border border-white/10">
                      <Text className="text-gray-400 font-medium text-sm mr-2">{tab.key}</Text>
                      {tab.count > 0 && (
                        <View className="bg-white/10 px-1.5 rounded-md">
                          <Text className="text-gray-400 text-[10px]">{tab.count}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        <FlatList
          data={DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 opacity-50">
              <Text className="text-white text-lg font-bold">No saved gigs yet.</Text>
            </View>
          }
        />

        {/* Floating Load More / Action Button */}
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <TouchableOpacity activeOpacity={0.8} className="shadow-lg shadow-purple-500/30">
            <LinearGradient
              colors={["#4c1d95", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-8 py-3 rounded-full flex-row items-center space-x-2 border border-white/10"
            >
              <Text className="text-white font-bold text-sm">
                Discover More Opportunities
              </Text>
              <ArrowRight size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}