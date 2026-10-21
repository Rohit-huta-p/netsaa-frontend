/**
 * usePickAndCrop — one call to pick a photo and crop it to a surface's frame.
 *
 *   const { pickAndCrop, cropperProps } = usePickAndCrop();
 *   const asset = await pickAndCrop('avatar');   // opens picker → MediaCropper
 *   if (asset) await uploadMediaFlow({ asset, entityType, entityId, purpose });
 *   // render once:  <MediaCropper {...cropperProps} />
 *
 * Picks at full resolution with the OS crop OFF (allowsEditing:false) — our own
 * MediaCropper does the framing, then resolves with an ImagePickerAsset-shaped
 * object (uri/mimeType/fileSize) that the existing uploader accepts as-is.
 * See memory: netsa-media-cropper-plan.
 */
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { MEDIA_SPEC, type CropPurpose, type CroppedAsset, type MediaSpec } from '@/constants/mediaSpec';
import useFeatureFlags from '@/hooks/useFeatureFlags';

interface CropperState {
  visible: boolean;
  uri: string | null;
  sourceWidth: number;
  sourceHeight: number;
  purpose: CropPurpose;
}

const IDLE: CropperState = { visible: false, uri: null, sourceWidth: 0, sourceHeight: 0, purpose: 'avatar' };

export function usePickAndCrop() {
  const { mediaCropper } = useFeatureFlags();
  const [state, setState] = useState<CropperState>(IDLE);
  const resolver = useRef<((a: ImagePickerAsset | null) => void) | null>(null);

  const settle = useCallback((asset: ImagePickerAsset | null) => {
    const r = resolver.current;
    resolver.current = null;
    setState((s) => ({ ...s, visible: false, uri: null }));
    r?.(asset);
  }, []);

  const pickAndCrop = useCallback(async (purpose: CropPurpose): Promise<ImagePickerAsset | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Allow photo access', 'Enable photo-library access in Settings to choose a photo.');
      return null;
    }
    const spec = MEDIA_SPEC[purpose];
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // Flag ON: pick full-res and let the in-app MediaCropper frame it.
      // Flag OFF: fall back to the OS crop at the surface's aspect.
      allowsEditing: !mediaCropper,
      aspect: mediaCropper ? undefined : spec.osAspect,
      quality: mediaCropper ? 1 : 0.9,
      exif: false,
    });
    if (res.canceled || !res.assets?.length) return null;
    const a = res.assets[0];
    if (!mediaCropper) return a; // OS crop already applied — ready to upload
    // Abandon any crop still pending before starting a new one.
    resolver.current?.(null);
    return new Promise<ImagePickerAsset | null>((resolve) => {
      resolver.current = resolve;
      setState({ visible: true, uri: a.uri, sourceWidth: a.width ?? 0, sourceHeight: a.height ?? 0, purpose });
    });
  }, [mediaCropper]);

  const onDone = useCallback(
    (cropped: CroppedAsset) => settle({ ...cropped, type: 'image' } as unknown as ImagePickerAsset),
    [settle],
  );
  const onCancel = useCallback(() => settle(null), [settle]);

  const spec: MediaSpec = MEDIA_SPEC[state.purpose];

  const cropperProps = {
    visible: state.visible,
    uri: state.uri,
    sourceWidth: state.sourceWidth,
    sourceHeight: state.sourceHeight,
    spec,
    onDone,
    onCancel,
  };

  return { pickAndCrop, cropperProps };
}

export default usePickAndCrop;
