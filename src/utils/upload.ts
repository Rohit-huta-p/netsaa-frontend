// File upload utilities for direct-to-S3 media uploads
import type { ImagePickerAsset } from 'expo-image-picker';
import mediaService, { MediaPurpose, EntityType } from '../services/mediaService';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface UploadOptions {
    uri: string;           // Local file URI from ImagePicker
    uploadUrl: string;     // Presigned PUT URL
    contentType: string;   // MIME type
    onProgress?: (progress: number) => void;
}

export interface UploadResult {
    success: boolean;
    error?: string;
}

export interface MediaUploadOptions {
    asset: ImagePickerAsset;
    entityType: EntityType;
    entityId: string;
    purpose: MediaPurpose;
    onProgress?: (progress: number) => void;
}

export interface RetryConfig {
    maxRetries: number;
    backoffMs: number;
}

// ─────────────────────────────────────────────────────────────
// S3 UPLOAD FUNCTION
// ─────────────────────────────────────────────────────────────

/**
 * Upload file to S3 using presigned PUT URL.
 * Uses fetch API for cross-platform compatibility (works on web).
 *
 * CRITICAL: This function NEVER sends data to backend APIs.
 *           Only direct-to-S3 PUT requests.
 */
export async function uploadToS3(options: UploadOptions): Promise<UploadResult> {
    const { uri, uploadUrl, contentType, onProgress } = options;

    console.log('[S3 Upload] Starting upload...');
    console.log('[S3 Upload] URI:', uri);
    console.log('[S3 Upload] Content-Type:', contentType);

    try {
        // Fetch the file as blob from the local URI
        const fileResponse = await fetch(uri);
        const blob = await fileResponse.blob();

        console.log('[S3 Upload] Blob size:', blob.size);

        if (onProgress) onProgress(10);

        // Upload to S3 using fetch PUT
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
            },
            body: blob,
        });

        console.log('[S3 Upload] Response status:', uploadResponse.status);

        if (onProgress) onProgress(100);

        if (uploadResponse.ok) {
            console.log('[S3 Upload] ✅ Upload successful!');
            return { success: true };
        } else {
            const errorText = await uploadResponse.text();
            console.log('[S3 Upload] ❌ Upload failed:', uploadResponse.status, errorText);
            return {
                success: false,
                error: `Upload failed with status ${uploadResponse.status}: ${errorText}`,
            };
        }
    } catch (err) {
        console.error('[S3 Upload] ❌ Exception:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Upload failed',
        };
    }
}



// ─────────────────────────────────────────────────────────────
// UPLOAD FLOW ORCHESTRATOR
// ─────────────────────────────────────────────────────────────

/**
 * Complete upload flow: presign → upload → return CDN URL.
 * This is the main function UI components should call.
 */
export async function uploadMediaFlow(
    options: MediaUploadOptions
): Promise<{ success: boolean; url?: string; error?: string }> {
    const { asset, entityType, entityId, purpose, onProgress } = options;

    const mimeType = asset.mimeType || 'application/octet-stream';
    const fileSize = asset.fileSize || 0;

    try {
        // Step 1: Get presigned URL
        // NOTE: fileName is intentionally NOT sent - backend generates keys using UUID
        const requestPayload = {
            entityType,
            entityId,
            purpose,
            mimeType,
            fileSize,
        };
        console.log('[Upload] Presign request payload:', JSON.stringify(requestPayload, null, 2));

        const presignResponse = await mediaService.requestPresignedUrl(requestPayload);

        if (!presignResponse.success) {
            return { success: false, error: presignResponse.message };
        }

        // Step 2: Upload to S3
        const uploadResult = await uploadToS3({
            uri: asset.uri,
            uploadUrl: presignResponse.data.uploadUrl,
            contentType: mimeType,
            onProgress,
        });

        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error };
        }

        // Step 3: Return file URL for entity storage
        return {
            success: true,
            url: presignResponse.data.fileUrl,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

// ─────────────────────────────────────────────────────────────
// RETRY WRAPPER
// ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Upload with automatic retry on failure.
 * CRITICAL: Requests NEW presigned URL on each retry to avoid expiry issues.
 */
export async function uploadWithRetry(
    options: MediaUploadOptions,
    config: RetryConfig = { maxRetries: 3, backoffMs: 1000 }
): Promise<{ success: boolean; url?: string; error?: string }> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
        // CRITICAL: Request NEW presigned URL on each retry
        const result = await uploadMediaFlow(options);

        if (result.success) {
            return result;
        }

        lastError = result.error;

        // Check if error is retryable
        const isRetryable =
            result.error?.includes('403') ||
            result.error?.includes('expired') ||
            result.error?.includes('Network error') ||
            result.error?.includes('status 5');

        if (!isRetryable) {
            // Non-retryable error
            break;
        }

        // Wait before next attempt with exponential backoff
        if (attempt < config.maxRetries - 1) {
            await sleep(config.backoffMs * Math.pow(2, attempt));
        }
    }

    return { success: false, error: lastError };
}

// ─────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 100;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate file before upload to avoid wasted bandwidth.
 */
export function validateMediaFile(
    asset: ImagePickerAsset,
    isVideo: boolean = false
): ValidationResult {
    const fileType = asset.mimeType || '';
    const fileSizeMB = (asset.fileSize || 0) / (1024 * 1024);

    // Check file type
    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowedTypes.some((t) => fileType.startsWith(t.split('/')[0]))) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
        };
    }

    // Check file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
    if (fileSizeMB > maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSize}MB, your file: ${fileSizeMB.toFixed(1)}MB`,
        };
    }

    return { valid: true };
}

/**
 * Check if file is large enough to warrant a warning.
 */
export function isLargeFile(asset: ImagePickerAsset): boolean {
    const fileSizeMB = (asset.fileSize || 0) / (1024 * 1024);
    return fileSizeMB > 50;
}
