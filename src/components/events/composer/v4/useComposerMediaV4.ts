/**
 * Photo + video upload for the v4 composer.
 *
 * Both upload against the signed-in USER's scope (entityType:'user',
 * purpose:'gallery' — a valid combo that needs no event to exist yet), so cover,
 * gallery and video can be added in-composer before the event is created. What
 * rides in the create payload's media[] (buildEventPayload → composerMapping
 * persists it) is the S3 url (photos) or the Mux playbackId (video).
 *
 * Photos reuse uploadMediaFlow (presign → S3 PUT) and are ready instantly.
 * Video reuses uploadVideoFlow (presign → direct-to-Mux PUT); Mux then processes
 * it asynchronously, so a video lands as status:'processing' and is advanced to
 * 'ready' (with its playbackId) by useComposerVideoPoll, which runs at the shell
 * level so polling survives step changes. This mirrors the live profile-reel flow.
 */
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaFlow, uploadVideoFlow } from '@/utils/upload';
import { useAuthStore } from '@/stores/authStore';
import { usePickAndCrop } from '@/hooks/usePickAndCrop';
import { useComposerStoreV4 } from './useComposerStoreV4';
import type { MediaItemV4 } from './composerForm';

const MAX_PHOTOS = 6; // including the cover
const MAX_VIDEOS = 2; // a promo/trailer plus one extra reel

export function useComposerMediaV4() {
  const user = useAuthStore((s) => s.user);
  const photos = useComposerStoreV4((s) => s.form.photos);
  const videos = useComposerStoreV4((s) => s.form.videos);
  const update = useComposerStoreV4((s) => s.update);
  const { pickAndCrop, cropperProps } = usePickAndCrop();
  const [uploading, setUploading] = useState<null | 'cover' | 'gallery' | 'video'>(null);

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
      // Event cover is a crop surface → pick + frame to 4:5 (eventCover spec).
      const asset = await pickAndCrop('eventCover');
      if (!asset) return;
      const item = await uploadOne(asset);
      if (item) update('cover', { ...item, isHero: true, sortOrder: 0 });
    } finally {
      setUploading(null);
    }
  }, [uploading, pickAndCrop, uploadOne, update]);

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

  const pickVideo = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Allow photo access', 'Enable photo-library access in Settings to add a video.');
      return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 60, // keep reels short — matches the profile reel cap
    });
    if (res.canceled || !res.assets?.length) return null;
    return res.assets[0];
  }, []);

  const addVideo = useCallback(async () => {
    if (uploading) return;
    if (videos.length >= MAX_VIDEOS) {
      Alert.alert('Video limit', `You can add up to ${MAX_VIDEOS} videos.`);
      return;
    }
    if (!user?._id) { Alert.alert('Not signed in', 'Please sign in again to upload.'); return; }
    setUploading('video');
    try {
      const asset = await pickVideo();
      if (!asset) return;
      // Direct-to-Mux PUT; bytes never touch our API. The reel starts life as
      // 'processing' and the shell-level poll fills in its playbackId when ready.
      const r = await uploadVideoFlow({ asset, entityType: 'user', entityId: user._id, purpose: 'gallery' });
      if (!r.success || !r.uploadId) { Alert.alert('Upload failed', r.error || 'Please try again.'); return; }
      const item: MediaItemV4 = {
        kind: 'video', url: '', status: 'processing', uploadId: r.uploadId,
        width: asset.width, height: asset.height,
      };
      update('videos', [...videos, item]);
    } finally {
      setUploading(null);
    }
  }, [uploading, videos, user, pickVideo, update]);

  const removeVideo = useCallback(
    (index: number) => update('videos', videos.filter((_, i) => i !== index)),
    [videos, update],
  );

  return { uploading, addCover, addPhoto, removeCover, removePhoto, addVideo, removeVideo, cropperProps };
}
