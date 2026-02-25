export interface MediaItem {
    /** "photo" or "video" – you can extend it later with more types */
    type: 'photo' | 'video';
    /** Remote URL (or local asset) */
    url: string;
    /** Optional thumbnail (used for lazy loading) */
    thumbnail?: string;
    /** Optional alt text for accessibility */
    alt?: string;
}

export interface MediaViewerModalProps {
    visible: boolean;
    /** Array of items to browse */
    mediaItems: MediaItem[];
    /** Which item to show first */
    initialIndex?: number;
    /** Callback when the modal is dismissed */
    onClose: () => void;
}
