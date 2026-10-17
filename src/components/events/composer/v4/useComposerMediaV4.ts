/**
 * Photo upload for the v4 composer.
 *
 * Photos upload against the signed-in USER's scope (entityType:'user',
 * purpose:'gallery' — a valid combo that needs no event to exist yet), so the
 * cover/gallery can be added in-composer before the event is created. The
 * returned S3 url rides in the create payload's media[] (buildEventPayload →
 * composerMapping persists it). Reuses the app's uploadMediaFlow presign→S3 PUT.
 *
 * NOTE: video is intentionally not handled here — Mux auto-attach is event-scoped,
 * so video needs the draft-first flow (create a draft event, upload against its
 * id, poll for the Mux playbackId). That's the documented follow-up.
 */
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaFlow } from '@/utils/upload';
import { useAuthStore } from '@/stores/authStore';
import { useComposerStoreV4 } from './useComposerStoreV4';
import type { MediaItemV4 } from './composerForm';

const MAX_PHOTOS = 6; // including the cover

export function useComposerMediaV4() {
  const user = useAuthStore((s) => s.user);
  const photos = useComposerStoreV4((s) => s.form.photos);
  const update = useComposerStoreV4((s) => s.update);
  const [uploading, setUploading] = useState<null | 'cover' | 'gallery'>(null);

  const pickImage = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Allow photo access', 'Enable photo-library access in Settings to add a cover or photos.');
      return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (res.canceled || !res.assets?.length) return null;
    return res.assets[0];
  }, []);

  const uploadOne = useCallback(async (asset: ImagePicker.ImagePickerAsset): Promise<MediaItemV4 | null> => {
    if (!user?._id) { Alert.alert('Not signed in', 'Please sign in again to upload.'); return null; }
    const r = await uploadMediaFlow({ asset, entityType: 'user', entityId: user._id, purpose: 'gallery' });
    if (!r.success || !r.url) { Alert.alert('Upload failed', r.error || 'Please try again.'); return null; }
    return { kind: 'photo', url: r.url, thumbnailUrl: r.url, width: asset.width, height: asset.height };
  }, [user]);

  const addCover = useCallback(async () => {
    if (uploading) return;
    setUploading('cover');
    try {
      const asset = await pickImage();
      if (!asset) return;
      const item = await uploadOne(asset);
      if (item) update('cover', { ...item, isHero: true, sortOrder: 0 });
    } finally {
      setUploading(null);
    }
  }, [uploading, pickImage, uploadOne, update]);

  const addPhoto = useCallback(async () => {
    if (uploading) return;
    if (photos.length >= MAX_PHOTOS - 1) {
      Alert.alert('Photo limit', `You can add up to ${MAX_PHOTOS} photos including the cover.`);
      return;
    }
    setUploading('gallery');
    try {
      const asset = await pickImage();
      if (!asset) return;
      const item = await uploadOne(asset);
      if (item) update('photos', [...photos, item]);
    } finally {
      setUploading(null);
    }
  }, [uploading, photos, pickImage, uploadOne, update]);

  const removeCover = useCallback(() => update('cover', null), [update]);
  const removePhoto = useCallback(
    (index: number) => update('photos', photos.filter((_, i) => i !== index)),
    [photos, update],
  );

  return { uploading, addCover, addPhoto, removeCover, removePhoto };
}
