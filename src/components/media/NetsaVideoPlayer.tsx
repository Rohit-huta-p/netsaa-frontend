import { useCallback, useRef, useState } from 'react';
import { View, Pressable, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RefreshCw } from 'lucide-react-native';
import VideoScrubber from './VideoScrubber';
import { useAutoHideControls } from '@/hooks/useAutoHideControls';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const T0 = '#F3EFE8', T2 = '#71717a', ORANGE = '#FF6B35';

export const muxHls = (id: string) => `https://stream.mux.com/${id}.m3u8`;
export const muxPoster = (id: string) => `https://image.mux.com/${id}/thumbnail.jpg?time=1`;

function fmt(t: number): string {
  const s = Math.max(0, Math.floor(t || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

export default function NetsaVideoPlayer({
  playbackId, poster, aspectRatio = 16 / 9, style,
}: { playbackId: string; poster?: string; aspectRatio?: number; style?: any }) {
  const viewRef = useRef<VideoView>(null);
  const player = useVideoPlayer(muxHls(playbackId), (p) => { p.timeUpdateEventInterval = 0.25; p.muted = true; });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime });
  const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });

  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  useEventListener(player, 'playToEnd', () => setEnded(true));

  const { visible, reveal } = useAutoHideControls(isPlaying && !ended);
  useReducedMotion(); // wired for future fade-timing; controls currently show/hide instantly

  const duration = player.duration || 0;
  const uiState =
    status === 'error' ? 'error'
    : ended ? 'ended'
    : !started ? 'idle'
    : status === 'loading' ? 'buffering'
    : isPlaying ? 'playing' : 'paused';

  const start = useCallback(() => { setStarted(true); setEnded(false); player.muted = false; player.play(); reveal(); }, [player, reveal]);
  const togglePlay = useCallback(() => { if (isPlaying) player.pause(); else player.play(); reveal(); }, [player, isPlaying, reveal]);
  const toggleMute = useCallback(() => { player.muted = !player.muted; reveal(); }, [player, reveal]);
  const seek = useCallback((frac: number) => { if (duration > 0) player.currentTime = frac * duration; }, [player, duration]);
  const onReplay = useCallback(() => { setEnded(false); player.currentTime = 0; player.play(); reveal(); }, [player, reveal]);
  const onRetry = useCallback(() => { player.replace(muxHls(playbackId)); setStarted(true); setEnded(false); player.play(); }, [player, playbackId]);
  const onFullscreen = useCallback(() => { viewRef.current?.enterFullscreen(); }, []);

  const showBar = (uiState === 'playing' || uiState === 'paused') && visible;

  return (
    <View style={[styles.frame, { aspectRatio }, style]}>
      <VideoView ref={viewRef} player={player} nativeControls={false} contentFit="cover" allowsFullscreen style={StyleSheet.absoluteFill} />

      {uiState === 'idle' && (
        <Image source={{ uri: poster ?? muxPoster(playbackId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      {(uiState === 'playing' || uiState === 'paused') && (
        <Pressable style={StyleSheet.absoluteFill} onPress={visible ? togglePlay : reveal} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause' : 'Play'} />
      )}

      {uiState === 'idle' && (
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.radial} pointerEvents="none" />
          <Pressable onPress={start} style={styles.glass} accessibilityRole="button" accessibilityLabel="Play">
            <Play size={23} color={T0} style={{ marginLeft: 3 }} />
          </Pressable>
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

      {showBar && (
        <View style={styles.barWrap} pointerEvents="box-none">
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#0E0C12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10 },
  radial: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,0,0,0.28)' },
  glass: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
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
