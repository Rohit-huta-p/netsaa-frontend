import { View, StyleSheet, Platform } from "react-native";

const VIDEO_URI = 'https://drive.google.com/file/d/1PAWv7v8MC-k1r5EGZDDPuAR_NrVpuoAv/view?usp=sharing';

export default function SurpriseScreen() {
    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <iframe
                    src={VIDEO_URI}
                    style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                />
            </View>
        );
    }

    // Native (iOS / Android)
    const { WebView } = require('react-native-webview');
    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: VIDEO_URI }}
                style={styles.webview}
                allowsFullscreenVideo
                allowsInlineMediaPlayback
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
});