// app/(app)/saved/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  Image,
  Modal,
} from "react-native";
import { Heart, Calendar, MapPin, Users, Sparkles, Clock, ArrowRight, TrendingUp, Ticket, X, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSavedItems, SavedItem } from "../../../src/hooks/useSavedItems";
import AppScrollView from '@/components/AppScrollView';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { useRouter } from "expo-router";
import { TopRightIcons } from "@/components/common/TopRightIcons";

const isWeb = Platform.OS === 'web';

/* ─────────────── QR Ticket Bottom Sheet ─────────────── */

function TicketBottomSheet({
  visible,
  onClose,
  qrCodes,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  qrCodes: string[];
  title: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();

  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, qrCodes.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  if (!qrCodes.length) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <View className="bg-zinc-900 rounded-t-3xl border-t border-white/10 pb-10 pt-4">
          {/* Handle */}
          <View className="w-10 h-1 bg-zinc-600 rounded-full self-center mb-6" />

          {/* Header */}
          <View className="flex-row justify-between items-center px-6 mb-6">
            <View>
              <Text className="text-white font-bold text-lg">{title}</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                Ticket {currentIndex + 1} of {qrCodes.length}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
            >
              <X size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* QR Card */}
          <View className="items-center px-6">
            <View className="bg-white rounded-2xl p-6 items-center" style={{ width: Math.min(width - 80, 320) }}>
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                Scan to check in
              </Text>
              <Image
                source={{ uri: qrCodes[currentIndex] }}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
              <Text className="text-zinc-400 text-[10px] font-mono mt-4">
                {`Ticket ${currentIndex + 1}`}
              </Text>
            </View>
          </View>

          {/* Navigation arrows */}
          {qrCodes.length > 1 && (
            <View className="flex-row justify-center items-center gap-6 mt-6">
              <TouchableOpacity
                onPress={goPrev}
                disabled={currentIndex === 0}
                className={`w-10 h-10 rounded-full items-center justify-center ${currentIndex === 0 ? 'bg-zinc-800/30' : 'bg-zinc-800'}`}
              >
                <ChevronLeft size={20} color={currentIndex === 0 ? '#3f3f46' : '#d4d4d8'} />
              </TouchableOpacity>

              {/* Dots */}
              <View className="flex-row gap-1.5">
                {qrCodes.map((_, i) => (
                  <View
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-zinc-700'}`}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={goNext}
                disabled={currentIndex === qrCodes.length - 1}
                className={`w-10 h-10 rounded-full items-center justify-center ${currentIndex === qrCodes.length - 1 ? 'bg-zinc-800/30' : 'bg-zinc-800'}`}
              >
                <ChevronRight size={20} color={currentIndex === qrCodes.length - 1 ? '#3f3f46' : '#d4d4d8'} />
              </TouchableOpacity>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            className="mx-6 mt-6 py-3 rounded-2xl bg-zinc-800 items-center border border-white/5"
          >
            <Text className="text-zinc-300 font-bold text-sm">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─────────────── Main Screen ─────────────── */

export default function SavedJobsScreen() {
  const [activeTab, setActiveTab] = useState("Saved");
  const [ticketModal, setTicketModal] = useState<{ visible: boolean; qrCodes: string[]; title: string }>({
    visible: false,
    qrCodes: [],
    title: '',
  });
  const { savedItems, appliedItems, upcomingItems, historyItems, isLoading, counts } = useSavedItems();
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  const isUpcoming = activeTab === "Upcoming";

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
            <View className="flex-row items-center gap-3 flex-1">
              <LinearGradient
                colors={item.imageGradient || ['#3B82F6', '#2563EB']}
                className="w-12 h-12 rounded-xl items-center justify-center opacity-90"
              >
                <Text className="text-xl">{item.icon}</Text>
              </LinearGradient>
              <View className="flex-1">
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

            {/* Hired badge for upcoming gigs */}
            {isUpcoming && item.type === 'GIG' && item.applicationStatus === 'hired' ? (
              <View className="bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <Text className="text-[10px] text-emerald-400 font-black">Hired 🎉</Text>
              </View>
            ) : (
              <TouchableOpacity className="bg-zinc-800/50 p-2 rounded-full">
                <Heart size={18} color="#ef4444" fill="#ef4444" />
              </TouchableOpacity>
            )}
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

            {/* Ticket count for upcoming events */}
            {isUpcoming && item.type === 'EVENT' && (item.ticketCount ?? 0) > 0 && (
              <View className="flex-row items-center gap-2">
                <Ticket size={14} color="#71717a" />
                <Text className="text-xs text-zinc-400 font-medium">
                  {item.ticketCount} {item.ticketCount === 1 ? 'ticket' : 'tickets'}
                </Text>
              </View>
            )}

            {/* Checked-in badge for history */}
            {activeTab === 'History' && item.checkedIn && (
              <View className="flex-row items-center gap-2">
                <CheckCircle size={14} color="#10b981" />
                <Text className="text-xs text-emerald-400 font-medium">Attended</Text>
              </View>
            )}
          </View>

          {/* Footer Strip */}
          <View className="pt-4 border-t border-white/5 flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Users size={12} color="#71717a" />
              <Text className="text-xs text-zinc-500">
                <Text className="text-zinc-300 font-bold">{item.attending}</Text>{' '}
                {item.type === 'EVENT' ? 'registered' : 'interested'}
              </Text>
            </View>

            {isUpcoming ? (
              <View className="flex-row items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                <Calendar size={10} color="#60a5fa" />
                <Text className="text-[10px] text-blue-400 font-bold">
                  EVENT DAY: {item.expiresOn}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                <Clock size={10} color="#f87171" />
                <Text className="text-[10px] text-red-400 font-bold">
                  EXP: {item.expiresOn}
                </Text>
              </View>
            )}
          </View>

          {/* View Tickets CTA for upcoming events */}
          {isUpcoming && item.type === 'EVENT' && (item.qrCodes?.length ?? 0) > 0 && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                setTicketModal({ visible: true, qrCodes: item.qrCodes!, title: item.title });
              }}
              className="mt-4 py-3 rounded-2xl bg-white/5 border border-white/10 items-center flex-row justify-center gap-2"
            >
              <Ticket size={16} color="#a78bfa" />
              <Text className="text-violet-400 font-bold text-sm">View Tickets</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <TopRightIcons />
      {/* Spotlight Effect */}
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
            'rgba(168, 85, 247, 0.15)',
            'rgba(236, 72, 153, 0.05)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <AppScrollView className="flex-1">
        {/* HERO SECTION */}
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

            {/* TABS */}
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
                  <React.Fragment key={`${item.type}-${item.id}`}>
                    {renderItem({ item })}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        </View>
      </AppScrollView>

      {/* QR Ticket Modal */}
      <TicketBottomSheet
        visible={ticketModal.visible}
        onClose={() => setTicketModal({ visible: false, qrCodes: [], title: '' })}
        qrCodes={ticketModal.qrCodes}
        title={ticketModal.title}
      />
    </View>
  );
}