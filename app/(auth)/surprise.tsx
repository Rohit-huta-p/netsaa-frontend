import { View, StyleSheet, Platform } from "react-native";

const VIDEO_ID = 'zyfXRZ6vc7w';
const VIDEO_URI = `https://www.youtube.com/embed/${VIDEO_ID}`;
const NATIVE_URI = `https://www.youtube.com/shorts/${VIDEO_ID}`;

export default function SurpriseScreen() {
    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <iframe
                    width="560"
                    height="315"
                    src={VIDEO_URI}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none' }}
                />
            </View>
        );
    }

    // Native (iOS / Android)
    const { WebView } = require('react-native-webview');
    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: NATIVE_URI }}
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