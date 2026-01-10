// Replace with your machine's IP address if testing on physical device
// Android Emulator uses 10.0.2.2 for localhost
// iOS Simulator uses localhost
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com';
