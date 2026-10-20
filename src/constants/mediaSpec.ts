/**
 * MEDIA_SPEC — the single source of truth for crop targets.
 *
 * Each "crop surface" (avatar, profile cover, event poster, agency logo) is
 * cropped to a FIXED frame on-device before upload, so what the user frames is
 * exactly what everyone sees. Gallery/showcase photos and video are NOT cropped
 * (they are shown as thumbnails that open full in MediaViewer) and have no entry
 * here. See memory: netsa-media-cropper-plan.
 */

export type CropShape = 'rect' | 'circle';

export type CropPurpose = 'avatar' | 'cover' | 'eventCover' | 'logo';

export interface MediaSpec {
  /** Aspect ratio as width / height. 1 = square, 0.8 = 4:5 portrait, 1.5 = 3:2 landscape. */
  aspect: number;
  /** Overlay mask: 'circle' for round avatars, 'rect' otherwise. */
  shape: CropShape;
  /** Target output width in px; height follows from `aspect`. Never upscales past the source. */
  outputWidth: number;
  /** JPEG quality, 0..1. */
  compress: number;
  /** Header label shown in the cropper. */
  title: string;
  /** Human-readable ratio, e.g. "4:5". */
  ratioLabel: string;
  /** Fallback aspect [w, h] for the OS crop when the in-app cropper is flag-off. */
  osAspect: [number, number];
}

/** Shape the cropper returns — ready to drop into uploadMediaFlow({ asset }). */
export interface CroppedAsset {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
}

export const MEDIA_SPEC: Record<CropPurpose, MediaSpec> = {
  avatar:     { aspect: 1,     shape: 'circle', outputWidth: 1080, compress: 0.85, title: 'Position your photo',  ratioLabel: '1:1', osAspect: [1, 1] },
  cover:      { aspect: 3 / 2, shape: 'rect',   outputWidth: 1620, compress: 0.85, title: 'Position your cover',  ratioLabel: '3:2', osAspect: [3, 2] },
  eventCover: { aspect: 4 / 5, shape: 'rect',   outputWidth: 1080, compress: 0.9,  title: 'Position your poster', ratioLabel: '4:5', osAspect: [4, 5] },
  logo:       { aspect: 1,     shape: 'rect',   outputWidth: 1080, compress: 0.85, title: 'Position your logo',   ratioLabel: '1:1', osAspect: [1, 1] },
};

export default MEDIA_SPEC;
