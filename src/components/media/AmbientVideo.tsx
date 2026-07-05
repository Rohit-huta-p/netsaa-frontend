import { useEffect } from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useIsFocused } from '@react-navigation/native';
import { muxHls, muxPoster } from './NetsaVideoPlayer';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * AmbientVideo — a muted, looping, chrome-less "living poster" backdrop.
 *
 * No controls, no tap, no scrubber, no fullscreen. It exists to make a hero
 * feel alive, not to be watched. Data/battery discipline (NETSA is Indian
 * mobile-first):
 *   - plays ONLY when `active` (the visible carousel page) AND the screen is
 *     focused — a blurred screen or an off-screen page holds the still poster;
 *   - honors OS reduce-motion by never autoplaying (holds the poster instead);
 *   - the Mux poster covers the surface until the first frame is ready, so the
 *     backdrop never flashes black.
 *
 * For an interactive, watch-this player (poster → tap → controls → fullscreen),
 * use NetsaVideoPlayer instead.
 */
export default function AmbientVideo({
  playbackId,
  poster,
  active = true,
  style,
}: {
  playbackId: string;
  poster?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const rm = useReducedMotion();
  const focused = useIsFocused();
  const player = useVideoPlayer(muxHls(playbackId), (p) => {
    p.muted = true;
    p.loop = true;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  const live = active && focused && !rm;
  useEffect(() => {
    if (live) player.play();
    else player.pause();
  }, [live, player]);

  // Poster covers the video whenever it isn't actively playing a decoded frame:
  // paused/inactive/reduce-motion, or still buffering the first frame.
  const showPoster = !live || status !== 'readyToPlay';

  return (
    <View style={style}>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      {showPoster && (
        <Image
          source={{ uri: poster ?? muxPoster(playbackId) }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
    </View>
  );
}
