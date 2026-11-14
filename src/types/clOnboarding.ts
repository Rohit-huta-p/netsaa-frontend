import type { ImagePickerAsset } from 'expo-image-picker';

export type CLOFormData = {
  organizationName: string;
  organizerTypeCategory: string;
  city: string;
  logoUrl: string;
  coverUrl: string;
  // Staged (not-yet-uploaded) picks for the register flow, where the account
  // does not exist until the final step. Uploaded after account creation.
  logoAsset?: ImagePickerAsset | null;
  coverAsset?: ImagePickerAsset | null;
  bio: string;
  services: string[];
  organizationWebsite: string;
  yearsInBusiness: string;
  teamSize: string;
  instagramHandle?: string;
};
