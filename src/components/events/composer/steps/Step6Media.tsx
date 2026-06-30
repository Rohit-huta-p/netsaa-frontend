import { View, Text, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X } from 'lucide-react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';
import { uploadMediaFlow } from '@/utils/upload';
import type { EventMedia } from '@/services/eventService';

const NETSA_FALLBACK_URL = 'netsa-fallback';
const MAX_MEDIA = 6;

export default function Step6Media({ onNext }: { onNext: () => void; onBack?: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    if (form.media.length >= MAX_MEDIA) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
      videoMaxDuration: 60,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const isVideo = asset.type === 'video';
      const uploaded = await uploadMediaFlow({
        asset,
        entityType: 'event',
        // 'temp' is used during creation — no event ID exists yet.
        // Backend accepts this and scopes the media key under a temp namespace.
        entityId: 'temp',
        purpose: isVideo ? 'gallery' : 'gallery',
      });
      if (!uploaded.success || !uploaded.url) {
        throw new Error(uploaded.error ?? 'Upload returned no URL');
      }
      const newMedia: EventMedia = {
        kind: isVideo ? 'video' : 'photo',
        url: uploaded.url,
        // thumbnailUrl is not generated server-side for event media at this time;
        // falls back to the full URL. Video consumers should handle this gracefully.
        thumbnailUrl: uploaded.url,
        width: asset.width ?? 1080,
        height: asset.height ?? 1080,
        duration: asset.duration ?? undefined,
        isHero: form.media.length === 0,
        sortOrder: form.media.length,
      };
      update('media', [...form.media, newMedia]);
    } catch (e) {
      Alert.alert('Upload failed', 'Try again or pick a different file.');
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => {
    const next = form.media
      .filter((_, i) => i !== idx)
      .map((m, i) => ({ ...m, isHero: i === 0, sortOrder: i }));
    update('media', next);
  };

  const setHero = (idx: number) => {
    const next = form.media.map((m, i) => ({
      ...m,
      isHero: i === idx,
      sortOrder: i === idx ? 0 : i + 1,
    }));
    update('media', next);
  };

  const useFallback = () => {
    update('media', [
      {
        kind: 'photo',
        url: NETSA_FALLBACK_URL,
        width: 1080,
        height: 1080,
        isHero: true,
        sortOrder: 0,
      },
    ]);
  };

  const canContinue = form.media.length >= 1;

  return (
    <View className="gap-7 mt-2">
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Photos · video (up to 6)</Text>

        <View className="flex-row flex-wrap gap-3">
          {form.media.map((m, idx) => (
            <View
              key={`${m.url}-${idx}`}
              className="relative w-24 h-24 rounded-xl overflow-hidden bg-event-bgAlt"
            >
              {m.url === NETSA_FALLBACK_URL ? (
                <View className="flex-1 items-center justify-center bg-black">
                  <Text className="font-serif text-event-brand text-2xl">N</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: m.thumbnailUrl ?? m.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}
              <Pressable
                onPress={() => remove(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center"
              >
                <X size={14} color="#fff" />
              </Pressable>
              {!m.isHero ? (
                <Pressable
                  onPress={() => setHero(idx)}
                  className="absolute bottom-1 left-1 right-1 py-1 rounded bg-black/70 items-center"
                >
                  <Text className="font-outfit text-white text-[10px]">Make hero</Text>
                </Pressable>
              ) : (
                <View className="absolute bottom-1 left-1 right-1 py-1 rounded bg-event-brand items-center">
                  <Text className="font-outfit text-white text-[10px] font-bold">Hero</Text>
                </View>
              )}
            </View>
          ))}

          {form.media.length < MAX_MEDIA ? (
            <Pressable
              onPress={pick}
              disabled={uploading}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-event-border items-center justify-center"
            >
              {uploading ? (
                <ActivityIndicator color={eventTokens.brand} />
              ) : (
                <Plus size={28} color={eventTokens.textSecondary} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      {form.media.length === 0 ? (
        <Pressable
          onPress={useFallback}
          className="rounded-2xl bg-event-surface border border-event-border p-4"
        >
          <Text className="font-outfit text-event-textPrimary text-sm">
            Use NETSA brand fallback instead
          </Text>
          <Text className="font-outfit text-event-textMuted text-xs mt-1">
            Black background + NETSA monogram. Required at publish.
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => { markComplete(6); onNext(); }}
        disabled={!canContinue}
        className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface'}`}
      >
        <Text className={`font-outfit font-bold ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}
