import React from 'react';
import { Modal, View, Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { X } from 'lucide-react-native';

interface Props {
  paymentSessionId: string;
  mode: 'sandbox' | 'production';
  onResult: (ok: boolean, err?: string) => void;
}

const CF_SDK = 'https://sdk.cashfree.com/js/v3/cashfree.js';

/** Inline page that loads the Cashfree v3 JS SDK and drives checkout for one session. */
function buildHtml(paymentSessionId: string, mode: 'sandbox' | 'production'): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <script src="${CF_SDK}"></script>
</head>
<body style="margin:0;background:#121216">
  <script>
    function post(m){ try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {} }
    window.addEventListener('load', function () {
      try {
        var cf = Cashfree({ mode: ${JSON.stringify(mode)} });
        cf.checkout({ paymentSessionId: ${JSON.stringify(paymentSessionId)}, redirectTarget: '_self' })
          .then(function (res) {
            if (res && res.error) post({ t: 'cf', ok: false, error: res.error.message || 'Payment failed' });
            else post({ t: 'cf', ok: true });
          })
          .catch(function (e) { post({ t: 'cf', ok: false, error: (e && e.message) || 'Payment error' }); });
      } catch (e) {
        post({ t: 'cf', ok: false, error: (e && e.message) || 'Checkout failed to load' });
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Native (iOS/Android) Cashfree checkout — a WebView running the Cashfree v3 JS SDK.
 * react-native-cashfree-pg-sdk needs a native rebuild we can't do here, so the SDK runs
 * inside a WebView instead. Metro resolves CashfreeCheckoutModal.web.tsx on web.
 */
export default function CashfreeCheckoutModal({ paymentSessionId, mode, onResult }: Props) {
  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m && m.t === 'cf') onResult(!!m.ok, m.error);
    } catch {
      /* ignore non-JSON bridge noise */
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => onResult(false, 'Payment cancelled.')}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Secure checkout</Text>
            <Pressable onPress={() => onResult(false, 'Payment cancelled.')} hitSlop={12}>
              <X size={22} color="#A1A1AA" />
            </Pressable>
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: buildHtml(paymentSessionId, mode), baseUrl: 'https://sdk.cashfree.com' }}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color="#FF6B35" />
              </View>
            )}
            style={{ flex: 1, backgroundColor: '#121216' }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    height: '92%',
    backgroundColor: '#121216',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F3EFE8' },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
