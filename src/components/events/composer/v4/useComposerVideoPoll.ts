/**
 * Mux status poll for in-composer video reels.
 *
 * Reels upload direct-to-Mux (useComposerMediaV4.addVideo) and land as
 * status:'processing'. Mux then transcodes asynchronously; this hook polls
 * media-service's getAssetStatus until each reel is 'ready' (fills in its
 * playbackId + poster + duration) or 'errored'. Mirrors ProfileEditModal's
 * reel poll.
 *
 * It lives at the SHELL level (ComposerShellV4), not in a step, so polling keeps
 * running when the host moves off the Describe step before Mux finishes. The
 * store is a module singleton, so writing back via `update` reaches whichever
 * step is mounted. Each tick re-reads the freshest videos[] from the store so a
 * concurrent add/remove is never clobbered.
 */
import { useEffect } from 'react';
import mediaService from '@/services/mediaService';
import { useComposerStoreV4 } from './useComposerStoreV4';

const POLL_MS = 4000;

export function useComposerVideoPoll() {
  const videos = useComposerStoreV4((s) => s.form.videos);
  const update = useComposerStoreV4((s) => s.update);

  useEffect(() => {
    const pending = videos.filter((v) => v.status === 'processing' && v.uploadId);
    if (pending.length === 0) return;

    const timer = setInterval(async () => {
      for (const r of pending) {
        try {
          const res = await mediaService.getAssetStatus(r.uploadId!);
          const s = res.data.status;
          if (s !== 'ready' && s !== 'errored') continue;
          const playbackId = res.data.playbackId;
          const cur = useComposerStoreV4.getState().form.videos;
          update('videos', cur.map((x) => x.uploadId !== r.uploadId ? x : ({
            ...x,
            status: s === 'ready' ? 'ready' as const : 'errored' as const,
            muxPlaybackId: playbackId || x.muxPlaybackId,
            url: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : x.url,
            thumbnailUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1` : x.thumbnailUrl,
            duration: res.data.duration ?? x.duration,
            aspectRatio: res.data.aspectRatio ?? x.aspectRatio,
          })));
        } catch {
          /* Mux not ready / transient — keep polling */
        }
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [videos, update]);
}
