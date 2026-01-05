// src/utils/platform.ts
import { Platform } from "react-native";


export const usePlatform = () => {
    const platform = Platform.OS;
    return {
        isWeb: platform === "web",
        isIOS: platform === "ios",
        isAndroid: platform === "android",
    };
}