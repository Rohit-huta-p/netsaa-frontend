// app/(app)/profile/similar/[id].tsx
// See-all page for "Similar artists" rail on the profile page.
// Route: /profile/similar/:id  (id = the subject artist's ID)
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSimilarPage } from '@/hooks/useSimilar';
import { PersonItem } from '@/components/search/items/PersonItem';

export default function SimilarSeeAllPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const artistId = (Array.isArray(id) ? id[0] : id) ?? '';
  const { data, isLoading } = useSimilarPage(artistId, 1, 20);

  return (
    <View className="flex-1 bg-[#09090b]">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center px-4 py-3 gap-3">
          <TouchableOpacity
            testID="similar-see-all-back"
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/8 items-center justify-center"
          >
            <ChevronLeft size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-bold text-base">Similar artists</Text>
            <Text className="text-gray-400 text-xs">{data?.total ?? 0} results</Text>
          </View>
        </View>
        <ScrollView className="flex-1 px-4">
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            (data?.items ?? []).map((p: any) => (
              <PersonItem
                key={p._id}
                item={p}
                status={'none'}
                onPress={() => router.push(`/profile/${p._id}` as any)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
