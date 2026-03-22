// src/types/index.ts
export type ExperienceEntry = {
  title?: string;
  role?: string;
  projectName?: string;
  organization?: string;
  venue?: string;
  location?: string;
  description?: string;
  date?: string;
  mediaLink?: string;
};

/* ── Settings types ── */

export type IPrivacySettings = {
  profileVisibility: 'public' | 'connections_only' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
};

export type INotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  allowConnectionRequests: boolean;
  messages: boolean;
  gigUpdates: boolean;
  eventUpdates: boolean;
  marketing: boolean;
};

export type IMessagingSettings = {
  allowMessagesFrom: 'connections' | 'anyone' | 'none';
  readReceipts: boolean;
};

export type IAccountSettings = {
  language: string;
  timezone: string;
  currency: string;
};

export type IUserSettings = {
  privacy: IPrivacySettings;
  notifications: INotificationSettings;
  messaging: IMessagingSettings;
  account: IAccountSettings;
};

export type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  role?: string;
  roles?: string[];
  accountStatus?: 'active' | 'deactivated' | 'scheduled_for_deletion';
  phoneNumber?: string;
  profileImageUrl?: string;
  // Registration personalization
  intent?: 'find_gigs' | 'hire_artists' | 'learn_workshops' | 'host_events';
  experienceLevel?: 'beginner' | 'intermediate' | 'professional';
  // Profile Fields
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experience?: ExperienceEntry[];
  artistType?: string;
  instagramHandle?: string;
  // Physical Attributes
  age?: string;
  gender?: string;
  height?: string;
  skinTone?: string;
  skinToneHex?: string;
  hasPhotos?: boolean;
  galleryUrls?: string[];
  videoUrls?: string[];
  // Organizer-specific fields
  organizationName?: string;
  organizationWebsite?: string;
  organizerTypeCategory?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  rating?: number;
  connections?: number;
  events?: number;
  // Settings
  settings?: IUserSettings;
  // Attached sub-documents from auth login
  organizerDetails?: any;
  artistDetails?: any;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string | null;
  user?: User;
  expiresAt?: number | null; // epoch ms
};

/** Envelope returned by POST /auth/verify-otp */
export type VerifyOtpResponse = {
  meta: { status: number; message: string };
  data: {
    userExists: boolean;
    token?: string;
    user?: User;
    phoneNumber?: string;
  };
  errors: any[];
};

