import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, Text, Image, ActivityIndicator, StyleSheet, Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RefreshCw } from 'lucide-react-native';
import VideoScrubber from './VideoScrubber';
import { useAutoHideControls } from '@/hooks/useAutoHideControls';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const T0 = '#F3EFE8', T2 = '#71717a', ORANGE = '#FF6B35';

export const muxHls = (id: string) => `https://stream.mux.com/${id}.m3u8`;
export const muxPoster = (id: string) => `https://image.mux.com/${id}/thumbnail.jpg?time=1`;

/**
 * Parse Mux's `aspect_ratio` — a "W:H" string like "16:9" / "9:16" (or a bare
 * decimal string) — to a number (w/h). Returns undefined when absent/unparseable
 * so callers can fall back rather than fabricate a ratio.
 */
export function parseAspectRatio(a?: string): number | undefined {
  if (!a) return undefined;
  if (a.includes(':')) {
    const [w, h] = a.split(':').map(Number);
    return w > 0 && h > 0 ? w / h : undefined;
  }
  const n = Number(a);
  return n > 0 ? n : undefined;
}

function fmt(t: number): string {
  const s = Math.max(0, Math.floor(t || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

// ---------------------------------------------------------------------------
// Web-only player: wraps a native <video> element with hls.js for Chrome/Firefox.
// Safari has native HLS support (canPlayType check), so it uses the src directly.
// expo-video's VideoView can't play HLS on Chrome without hls.js.
// A separate component (not an early-return inside NetsaVideoPlayer) so React
// hooks are always called the same number of times regardless of Platform.OS.
// ---------------------------------------------------------------------------
function WebVideoPlayer({
  playbackId, poster, fill, contentFit,
}: {
  playbackId: string; poster?: string; fill?: boolean; contentFit?: 'cover' | 'contain';
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const src = muxHls(playbackId);

    // iOS Safari & iOS Chrome (WebKit): native HLS — set src SYNCHRONOUSLY so the
    // browser is ready when the user taps the play button on the poster overlay.
    // If we waited for the async hls.js import the tap would fire with no src set.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // Desktop Chrome / Firefox: no native HLS — load via hls.js + MSE.
    import('hls.js').then(({ default: Hls }) => {
      if (!videoRef.current) return;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false });
        hls.loadSource(src);
        hls.attachMedia(video);
        (videoRef as any)._hls = hls;
      }
    });

    return () => {
      const hls = (videoRef as any)._hls;
      if (hls) { hls.destroy(); (videoRef as any)._hls = null; }
    };
  }, [playbackId]);

  return (
    <div style={{
      ...(fill ? { position: 'absolute', inset: 0 } : { aspectRatio: '16 / 9' }),
      backgroundColor: '#0E0C12', borderRadius: 14, overflow: 'hidden',
    }}>
      <video
        ref={videoRef}
        poster={poster ?? muxPoster(playbackId)}
        controls
        playsInline
        style={{ width: '100%', height: '100%', objectFit: contentFit === 'contain' ? 'contain' : 'cover' }}
      />
    </div>
  );
}

type NetsaVideoPlayerProps = {
  playbackId: string; poster?: string; aspectRatio?: number; style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain'; fill?: boolean; showRotateCue?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

// Wrapper: routes to the web player (hls.js) on web, expo-video on native.
// Keeping them as separate components avoids a hooks-count mismatch that would
// occur if we used an early-return inside the hooked NativeVideoPlayer body.
export default function NetsaVideoPlayer(props: NetsaVideoPlayerProps) {
  if (Platform.OS === 'web') {
    return <WebVideoPlayer playbackId={props.playbackId} poster={props.poster} fill={props.fill} contentFit={props.contentFit} />;
  }
  return <NativeVideoPlayer {...props} />;
}

function NativeVideoPlayer({
  playbackId, poster, aspectRatio = 16 / 9, style, contentFit = 'cover', fill = false, showRotateCue = false,
  onFullscreenChange,
}: NetsaVideoPlayerProps) {
  const viewRef = useRef<VideoView>(null);
  const player = useVideoPlayer(muxHls(playbackId), (p) => { p.timeUpdateEventInterval = 0.25; p.muted = true; });
  const focused = useIsFocused();

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  // expo-video's TimeUpdateEventPayload requires more fields than we seed; cast
  // the partial initial (currentTime is all we read — scrubber + time label).
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime } as any);
  const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });

  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  // True while we've kicked off a replace() to recover from an error — shows the
  // buffering spinner until the player clears the error, preventing a flash of
  // "Couldn't play" between the replace() call and the statusChange event firing.
  const [recovering, setRecovering] = useState(false);
  useEventListener(player, 'playToEnd', () => setEnded(true));

  const { visible, reveal } = useAutoHideControls(isPlaying && !ended);
  const rm = useReducedMotion();

  // Set to true when we want play() to fire as soon as the player reaches readyToPlay.
  // Using a ref (not state) so it doesn't trigger re-renders.
  const playOnReady = useRef(false);

  useEffect(() => { if (!focused) player.pause(); }, [focused, player]);
  useEffect(() => { if (recovering && status !== 'error') setRecovering(false); }, [status, recovering]);
  // Deferred play: fires play() exactly once when the player finishes loading.
  // This prevents "Couldn't play" caused by calling play() while status==='loading'.
  useEffect(() => {
    if (playOnReady.current && status === 'readyToPlay') {
      playOnReady.current = false;
      player.muted = false;
      player.play();
    }
  }, [status, player]);
  // Auto-retry up to 2× on mid-play errors before showing the error UI.
  // expo-video on web can fire a spurious 'error' when the VideoView is resized on
  // first layout (e.g. pagerH update in MediaViewer) — silent retries absorb that.
  const retryCount = useRef(0);
  useEffect(() => { if (isPlaying) retryCount.current = 0; }, [isPlaying]);
  useEffect(() => {
    if (status !== 'error' || !started) return;
    console.warn('[NetsaVideoPlayer] playback error id:', playbackId, 'attempt', retryCount.current + 1);
    if (retryCount.current < 2) {
      retryCount.current++;
      setRecovering(true);
      playOnReady.current = true;
      player.replace(muxHls(playbackId));
    }
  }, [status, started, player, playbackId]);

  const duration = player.duration || 0;
  // IMPORTANT: !started must be checked before status === 'error' so that a
  // background-load error (player preloads HLS on mount, muted, before user taps)
  // doesn't bypass the idle poster+play-button and show "Couldn't play" immediately.
  const uiState =
    !started ? 'idle'
    : (recovering || status === 'loading') ? 'buffering'
    : status === 'error' ? 'error'
    : ended ? 'ended'
    : isPlaying ? 'playing' : 'paused';

  const start = useCallback(() => {
    if (player.status === 'error') {
      // Background preload errored; reload and defer play to readyToPlay.
      setRecovering(true);
      player.replace(muxHls(playbackId));
      playOnReady.current = true;
    } else if (player.status === 'readyToPlay') {
      player.muted = false;
      player.play();
    } else {
      // Still loading — queue play for when the player finishes loading.
      playOnReady.current = true;
    }
    setStarted(true);
    setEnded(false);
    reveal();
  }, [player, playbackId, reveal]);
  const togglePlay = useCallback(() => { if (isPlaying) player.pause(); else player.play(); reveal(); }, [player, isPlaying, reveal]);
  const toggleMute = useCallback(() => { player.muted = !player.muted; reveal(); }, [player, reveal]);
  const seek = useCallback((frac: number) => { if (duration > 0) player.currentTime = frac * duration; }, [player, duration]);
  const onReplay = useCallback(() => { setEnded(false); player.currentTime = 0; player.play(); reveal(); }, [player, reveal]);
  const onRetry = useCallback(() => {
    setRecovering(true);
    playOnReady.current = true;
    retryCount.current = 0;
    player.replace(muxHls(playbackId));
    setStarted(true);
    setEnded(false);
  }, [player, playbackId]);
  const onFullscreen = useCallback(() => { viewRef.current?.enterFullscreen(); }, []);

  const barOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barOpacity, { toValue: visible ? 1 : 0, duration: rm ? 0 : 200, useNativeDriver: true }).start();
  }, [visible, rm, barOpacity]);

  return (
    <View style={fill ? [styles.frame, styles.fill, style] : [styles.frame, { aspectRatio }, style]}>
      <VideoView
        ref={viewRef}
        player={player}
        nativeControls={false}
        contentFit={contentFit}
        allowsFullscreen
        onFullscreenEnter={() => onFullscreenChange?.(true)}
        onFullscreenExit={() => onFullscreenChange?.(false)}
        style={styles.media}
      />

      {uiState === 'idle' && (
        <Image source={{ uri: poster ?? muxPoster(playbackId) }} style={styles.media} resizeMode={contentFit} />
      )}

      {(uiState === 'playing' || uiState === 'paused') && (
        <Pressable style={StyleSheet.absoluteFill} onPress={visible ? togglePlay : reveal} />
      )}

      {uiState === 'idle' && (
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.radial} pointerEvents="none" />
          <Pressable onPress={start} style={styles.glass} accessibilityRole="button" accessibilityLabel="Play">
            <Play size={23} color={T0} style={{ marginLeft: 3 }} />
          </Pressable>
          {showRotateCue && (
            <Pressable onPress={() => { start(); onFullscreen(); }} style={styles.rotateCue} accessibilityRole="button" accessibilityLabel="Rotate for fullscreen">
              <RotateCcw size={13} color="#FFD9C7" />
              <Text style={styles.rotateCueText}>Rotate for fullscreen</Text>
            </Pressable>
          )}
        </View>
      )}
      {uiState === 'buffering' && (<View style={styles.center} pointerEvents="none"><ActivityIndicator color={ORANGE} /></View>)}
      {uiState === 'ended' && (
        <View style={styles.center}>
          <Pressable onPress={onReplay} style={styles.glass} accessibilityRole="button" accessibilityLabel="Replay"><RotateCcw size={22} color={T0} /></Pressable>
        </View>
      )}
      {uiState === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errText}>Couldn't play</Text>
          <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button" accessibilityLabel="Retry">
            <RefreshCw size={14} color={T0} /><Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {uiState === 'idle' && duration > 0 && (
        <View style={styles.pill}><Text style={styles.pillText}>{fmt(duration)}</Text></View>
      )}

      {(uiState === 'playing' || uiState === 'paused') && (
        <Animated.View style={[styles.barWrap, { opacity: barOpacity }]} pointerEvents={visible ? 'box-none' : 'none'}>
          <LinearGradient colors={['transparent', 'rgba(6,5,9,0.9)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.bar}>
            <VideoScrubber progress={duration > 0 ? currentTime / duration : 0} onSeek={seek} />
            <View style={styles.row}>
              <Pressable onPress={togglePlay} hitSlop={8} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={19} color={T0} /> : <Play size={19} color={T0} />}
              </Pressable>
              <Text style={styles.time}>{fmt(currentTime)} <Text style={{ color: T2 }}>/ {fmt(duration)}</Text></Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={toggleMute} hitSlop={8} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX size={19} color={T0} /> : <Volume2 size={19} color={T0} />}
              </Pressable>
              <Pressable onPress={onFullscreen} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fullscreen"><Maximize size={18} color={T0} /></Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#0E0C12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  // fill mode: fill the parent exactly, no aspect-ratio box (fullscreen lightbox).
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  /**
   * The media layer (VideoView / poster). MUST carry explicit width+height, not
   * just absoluteFill's insets: on web expo-video renders a raw <video>, and a
   * replaced element with `width:auto` + left/right:0 resolves to its INTRINSIC
   * size (a 1080x1920 clip renders 1080x1920, cornered top-left) instead of
   * stretching. Explicit 100% sizes the box so objectFit can letterbox inside it.
   */
  media: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10 },
  radial: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,0,0,0.28)' },
  glass: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  // Rotate-to-fullscreen cue for wide clips (idle state) — warm accent pill.
  rotateCue: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,107,53,0.16)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.45)' },
  rotateCueText: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#FFD9C7' },
  pill: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  pillText: { fontFamily: 'SpaceMono-Regular', fontSize: 11, color: T0 },
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 40 },
  bar: { paddingHorizontal: 13, paddingBottom: 13, paddingTop: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 11 },
  time: { fontFamily: 'SpaceMono-Regular', fontSize: 11, color: T0 },
  errText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: T2 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  retryText: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: T0 },
});
