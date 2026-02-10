// src/types/index.ts
export type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  role?: string;
  roles?: string[];
  phoneNumber?: string;
  profileImageUrl?: string;
  // Registration personalization
  intent?: 'find_gigs' | 'hire_artists' | 'learn_workshops' | 'host_events';
  experienceLevel?: 'beginner' | 'intermediate' | 'professional';
  // Profile Fields
  bio?: string;
  location?: string;
  skills?: string[];
  experience?: string[];
  artistType?: string;
  instagramHandle?: string;
  // Physical Attributes
  age?: string;
  gender?: string;
  height?: string;
  skinTone?: string;
  hasPhotos?: boolean;
  galleryUrls?: string[];
  videoUrls?: string[];
  rating?: number;
  connections?: number;
  events?: number;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string | null;
  user?: User;
  expiresAt?: number | null; // epoch ms
};
