import React from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Existing components (will be refined later)
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { FeaturedWorks } from '@/components/profile/FeaturedWorks';
import { ProfessionalHistory } from '@/components/profile/ProfessionalHistory';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { Testimonials } from '@/components/profile/Testimonials';
import { ProfileData } from '@/components/profile/types';
import { ProfileEditModal } from './components/ProfileEditModal';
import { useAuthStore } from '@/stores/authStore';
import { mapUserToProfileData } from '@/features/profile/utils/mapUserToProfileData';
import { useUser } from '@/hooks/useUser';
import { ActivityIndicator, Text } from 'react-native';

// ---------------------------------------------------------------------------
// ProfileScreen – high‑level container that provides a sticky glass‑morphic header
// and full-width stacked content sections, exactly matching the screenshots.
// ---------------------------------------------------------------------------

type Props = {
  userId: string;
  isOwner: boolean;
  gigContext?: { gigId?: string; applicationId?: string; fromGig?: string };
};

export const ProfileScreen: React.FC<Props> = ({ userId, isOwner, gigContext }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024; // lg breakpoint

  const { user: authUser } = useAuthStore();

  // Conditionally fetch: skip API call if we are the owner, since we use `authUser`
  const { data: fetchedUser, isLoading, error } = useUser(isOwner ? undefined : userId);

  // Scroll position for sticky header animation
  const scrollY = useSharedValue(0);
  const HEADER_HEIGHT = 80; // approximate height of the header in dp

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    // Clamp translation to keep header sticky after it scrolls out of view
    const translateY = -Math.min(scrollY.value, HEADER_HEIGHT);
    return {
      transform: [{ translateY }],
    };
  });

  // Mock data to hydrate the ProfileSidebar safely for now
  const dummyProfileData = {
    bio: "Placeholder manifesto and bio text.",
    age: "24",
    height: "5'9\"",
    skinTone: "Fair",
    skills: ["Contemporary", "Jazz"],
    instagramHandle: "example",
    youtubeUrl: "https://youtube.com",
    galleryUrls: [],
    videoUrls: [],
    testimonials: [],
    experience: [],
  };

  // If the user is viewing their own profile, we use authUser. Otherwise, we use the fetchedUser.
  const displayUser = isOwner ? authUser : fetchedUser;
  const isOrganizerProfile = displayUser?.role === 'organizer';
  const displayProfileData = displayUser ? mapUserToProfileData(displayUser, isOrganizerProfile) : null;

  // Provide a fallback combining dummy data (for missing arrays etc) and real data
  const mergedProfileData = (displayProfileData ? { ...dummyProfileData, ...displayProfileData } : dummyProfileData) as ProfileData;

  if (isLoading && !isOwner) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error && !isOwner) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#EF4444' }}>Error loading profile.</Text>
      </View>
    );
  }

  if (!displayUser && !isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#9CA3AF' }}>User not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sticky header – receives animated style */}
          <Animated.View style={[styles.headerWrapper]}>
            <ProfileHeader
              organizationName={mergedProfileData.organizationName as string}
              fullName={mergedProfileData.fullName as string}
              headline={mergedProfileData.headline}
              artistType={mergedProfileData.artistType ? (Array.isArray(mergedProfileData.artistType) ? mergedProfileData.artistType.join(', ') : mergedProfileData.artistType) : undefined}
              location={mergedProfileData.location}
              isOrganizer={isOrganizerProfile}
              profileImageUrl={mergedProfileData.profileImageUrl}
              stats={{ connections: displayUser?.connections || 0, rating: displayUser?.rating, events: displayUser?.events }}
              isDesktop={isDesktop}
              isEditable={isOwner}
            />
          </Animated.View>

          {/* 2-6 Column Grid Layout */}
          <View style={[styles.gridContainer, isDesktop ? styles.rowLayout : styles.columnLayout]}>

            {/* 2-Col Span: Sidebar */}
            <View style={isDesktop ? styles.sidebarColumn : styles.fullWidth}>
              <ProfileSidebar
                profileData={mergedProfileData}
                isEditable={isOwner}
                isDesktop={isDesktop}
                isOrganizer={isOrganizerProfile}
              />
            </View>

            {/* 6-Col Span: Main Content */}
            <View style={[isDesktop ? styles.mainColumn : styles.fullWidth, styles.mainContentGap]}>
              {/* 1st Section: Gallery / Media */}
              <FeaturedWorks
                galleryUrls={mergedProfileData.galleryUrls || []}
                videoUrls={mergedProfileData.videoUrls || []}
                hasPhotos={false}
                isDesktop={isDesktop}
                isEditable={isOwner}
                isOrganizer={isOrganizerProfile}
              />

              {/* 2nd Section: Professional History */}
              <ProfessionalHistory experience={mergedProfileData.experience || []} isEditable={isOwner} isOrganizer={isOrganizerProfile} />

              {/* Testimonials */}
              <Testimonials testimonials={mergedProfileData.testimonials} />
            </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      {/* Render the Edit Modal which controls its own visibility via the UI Store */}
      {isOwner && (
        <ProfileEditModal
          profileData={mergedProfileData}
          isOrganizer={isOrganizerProfile}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // dark background consistent with app theme
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    width: '90%',
    marginHorizontal: '5%',
  },
  headerWrapper: {
    // Glass‑morphic container – the actual visual effect is handled inside ProfileHeader
    // Here we only ensure the wrapper participates in the sticky animation.
    zIndex: 10,
    marginTop: 25,
    marginBottom: 25,
    paddingHorizontal: 12,
  },
  gridContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
    gap: 16,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnLayout: {
    flexDirection: 'column',
  },
  sidebarColumn: {
    flex: 25, // Appx 2/8 (or 25% of 12-col)
  },
  mainColumn: {
    flex: 75, // Appx 6/8
  },
  fullWidth: {
    width: '100%',
  },
  mainContentGap: {
    flexDirection: 'column',
    gap: 16,
  }
});
