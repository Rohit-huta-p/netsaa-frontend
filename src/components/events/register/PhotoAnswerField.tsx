/**
 * In-sheet photo answer field for a host custom question of type `photo`.
 *
 * Replaces the old link-text fallback: picks one image from the library, uploads
 * it to S3 via the proven `uploadMediaFlow` path (presign → S3 PUT), and reports
 * the returned CDN url back up. The parent stores that url as the answer VALUE —
 * a plain string, so it rides through `buildAnswers()` and the required-question
 * check unchanged, and the host roster renders it like any other answer.
 *
 * Presign scope — `entityType:'user'`, `entityId` = the signed-in attendee's
 * `_id`, `purpose:'gallery'`:
 *   • The attendee is NOT the event owner, so an event-scoped presign would 403
 *     (media-service checkEventOwnership gates on `event.organizerId === user.id`).
 *     The `user` scope authorizes on `user.id === entityId`, which holds for the
 *     attendee's own id.
 *   • `gallery` is the neutral user-scoped upload bucket — NOT `portfolio`/`avatar`,
 *     the profile-display buckets — and is the exact combo the event composer
 *     already uses (useComposerMediaV4). Nothing enumerates S3 by prefix for the
 *     public profile (the profile gallery is an explicit url list on the model),
 *     and this url only lands in the event registration's `answers[]`, so a
 *     register-answer photo never leaks into the attendee's portfolio.
 *
 * Single photo per question. Cropping is intentionally skipped — this is a
 * free-form answer photo, not an avatar.
 */
import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, RefreshCw, X } from 'lucide-react-native';
import { uploadWithRetry, validateMediaFile } from '@/utils/upload';
import { eventTokens } from '@/lib/eventTokens';

interface Props {
  /** Current answer — the uploaded CDN url, or empty/undefined when no photo yet. */
  value?: string;
  /** url on add/replace, null on remove. */
  onChange: (url: string | null) => void;
  /** The signed-in attendee's user `_id` (the presign entityId). */
  entityId: string;
  disabled?: boolean;
}

export default function PhotoAnswerField({ value, onChange, entityId, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(async () => {
    if (uploading || disabled) return;
    if (!entityId) {
      Alert.alert('Not signed in', 'Please sign in again to add a photo.');
      return;
    }
    setError(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Allow photo access', 'Enable photo-library access in Settings to add a photo.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];

    const check = validateMediaFile(asset);
    if (!check.valid) {
      setError(check.error ?? "That file can't be used.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      // uploadWithRetry re-presigns on each attempt (fresh URL), so a 403/expiry
      // or a flaky S3 PUT self-heals without the user re-picking.
      const r = await uploadWithRetry({
        asset,
        entityType: 'user',
        entityId,
        purpose: 'gallery',
        onProgress: setProgress,
      });
      if (r.success && r.url) {
        onChange(r.url);
      } else {
        setError(r.error ?? 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  }, [uploading, disabled, entityId, onChange]);

  const remove = useCallback(() => {
    if (uploading) return;
    setError(null);
    onChange(null);
  }, [uploading, onChange]);

  // UPLOADING — spinner + (when available) percent
  if (uploading) {
    return (
      <View className="flex-row items-center gap-3 rounded-2xl bg-event-surface border border-event-border px-4 py-3.5">
        <ActivityIndicator color={eventTokens.brand} />
        <Text className="font-outfit text-event-textSecondary text-sm">
          {progress > 0 && progress < 100 ? `Uploading ${Math.round(progress)}%` : 'Uploading…'}
        </Text>
      </View>
    );
  }

  // HAS PHOTO — thumbnail preview + Replace / Remove
  if (value) {
    return (
      <View className="gap-2">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: value }}
            style={{ width: 72, height: 72, borderRadius: 14 }}
            contentFit="cover"
            transition={150}
            accessibilityLabel="Your uploaded photo"
          />
          <View className="flex-1 gap-2 items-start">
            <Pressable
              onPress={pickAndUpload}
              disabled={disabled}
              accessibilityRole="button"
              className="flex-row items-center gap-2 rounded-xl bg-event-surface border border-event-border px-3 py-2"
            >
              <RefreshCw size={14} color={eventTokens.textSecondary} />
              <Text className="font-outfit text-event-textSecondary text-sm">Replace</Text>
            </Pressable>
            <Pressable
              onPress={remove}
              accessibilityRole="button"
              className="flex-row items-center gap-2 rounded-xl px-3 py-2"
            >
              <X size={14} color={eventTokens.textMuted} />
              <Text className="font-outfit text-event-textMuted text-sm">Remove</Text>
            </Pressable>
          </View>
        </View>
        {error ? <Text className="font-outfit text-event-capacityUrgent text-xs">{error}</Text> : null}
      </View>
    );
  }

  // EMPTY — add button
  return (
    <View className="gap-2">
      <Pressable
        onPress={pickAndUpload}
        disabled={disabled}
        accessibilityRole="button"
        className={`flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-event-border bg-event-surface px-4 py-4 ${
          disabled ? 'opacity-40' : ''
        }`}
      >
        <ImagePlus size={18} color={eventTokens.textSecondary} />
        <Text className="font-outfit text-event-textSecondary text-sm">Add photo</Text>
      </Pressable>
      {error ? <Text className="font-outfit text-event-capacityUrgent text-xs">{error}</Text> : null}
    </View>
  );
}
