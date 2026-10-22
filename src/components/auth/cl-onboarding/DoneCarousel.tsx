// DoneCarousel — 4-slide value-prop after setup. Full-bleed images from assets/.
// Images: assets/onboarding/creative-lead-onboarding-images/*-full.png
import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, FlatList, Dimensions, StyleSheet,
  ImageBackground, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';

interface Props { onDone: () => void }

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'booked',
    bg: require('@/assets/onboarding/creative-lead-onboarding-images/get-booked-full.png'),
    accent: '#8B5CF6',
    tag: 'FOR YOU',
    headline: 'Get booked for\nthe right projects',
    body: 'Build your page, showcase your work, and attract clients who match your vision.',
  },
  {
    key: 'event',
    bg: require('@/assets/onboarding/creative-lead-onboarding-images/host-a-event-full.png'),
    accent: '#14B8A6',
    tag: 'EVENTS',
    headline: 'Host workshops,\nconcerts & more',
    body: 'Create events, set ticket prices, manage registrations — all in one place.',
  },
  {
    key: 'gig',
    bg: require('@/assets/onboarding/creative-lead-onboarding-images/post-a-gig-full.png'),
    accent: '#FF6B35',
    tag: 'GIGS',
    headline: 'Post gigs, find\nthe right artists',
    body: 'Describe the role and let artists apply. Review, shortlist, and hire.',
  },
  {
    key: 'profile',
    bg: require('@/assets/onboarding/creative-lead-onboarding-images/share-your-profile-full.png'),
    accent: '#2563EB',
    tag: 'YOUR PAGE',
    headline: 'Share your page,\nbuild your network',
    body: 'Your company profile is live. Connect with artists, share your link, grow.',
  },
] as const;

export default function DoneCarousel({ onDone }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<FlatList>(null);
  const insets  = useSafeAreaInsets();
  const isLast  = activeIdx === SLIDES.length - 1;

  function goNext() {
    if (isLast) { onDone(); return; }
    const next = activeIdx + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIdx(next);
  }

  function onScroll(e: any) {
    const x = e.nativeEvent.contentOffset.x;
    setActiveIdx(Math.round(x / W));
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={i => i.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <ImageBackground
            source={item.bg}
            style={[s.slide, { width: W, height: H }]}
            resizeMode="cover"
          >
            {/* gradient mask bottom half */}
            <View style={s.gradMask} />

            {/* Slide content */}
            <View style={[s.copy, { paddingBottom: insets.bottom + 100 }]}>
              <Text style={[s.tag, { color: item.accent }]}>{item.tag}</Text>
              <Text style={s.headline}>{item.headline}</Text>
              <Text style={s.body}>{item.body}</Text>
            </View>
          </ImageBackground>
        )}
      />

      {/* Bottom chrome — dots + button */}
      <View style={[s.chrome, { paddingBottom: insets.bottom + 20 }]}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === activeIdx && s.dotActive,
              i === activeIdx && { backgroundColor: SLIDES[i].accent }]}
            />
          ))}
        </View>

        {/* Circular next / enter button */}
        <Pressable
          style={[s.nextBtn, { backgroundColor: SLIDES[activeIdx].accent }]}
          onPress={goNext}
        >
          {isLast
            ? <Text style={s.nextLabel}>Enter NETSA</Text>
            : <ArrowRight size={20} color="#fff" />
          }
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#050505' },
  slide:     { justifyContent: 'flex-end' },
  gradMask:  {
    ...StyleSheet.absoluteFillObject,
    // gradient from transparent top → very dark bottom
    // RN doesn't have LinearGradient built-in; use a semi-opaque bottom overlay
    top: '40%',
    backgroundColor: 'rgba(5,5,5,0.82)',
  },
  copy:      { paddingHorizontal: 24, gap: 8 },
  tag:       { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 1.6 },
  headline:  { fontFamily: 'Outfit-Bold', fontSize: 34, color: '#F5F5F0', lineHeight: 40, letterSpacing: -0.5 },
  body:      { fontFamily: 'Outfit-Light', fontSize: 14, color: 'rgba(245,245,240,0.55)', lineHeight: 21 },
  chrome:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16 },
  dots:      { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(245,245,240,0.2)' },
  dotActive: { width: 18, height: 5, borderRadius: 3 },
  nextBtn:   { minWidth: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  nextLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#fff' },
});
