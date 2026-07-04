import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

/**
 * Plays a Mux-hosted event video via adaptive HLS.
 * `playbackId` is the Mux playback id stored on the event's media entry
 * (`muxPlaybackId`). Poster frames + streaming come free from Mux.
 */
export default function EventVideo({ playbackId, style }: { playbackId: string; style?: any }) {
  const player = useVideoPlayer(`https://stream.mux.com/${playbackId}.m3u8`, (p) => {
    p.loop = true;
    p.muted = true;
  });

  return (
    <View style={[styles.wrap, style]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#000' },
});
