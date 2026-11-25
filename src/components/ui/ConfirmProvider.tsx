import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Platform, Alert } from 'react-native';

/**
 * App-wide confirm dialog that works on web AND native.
 *
 * WHY: `Alert.alert(title, msg, [buttons])` does NOT render on react-native-web
 * (netsaa.com) — the dialog never appears, so any destructive action gated behind
 * a confirm button silently no-ops. This provider renders a real <Modal>, so the
 * confirm works on every platform. See memory `netsa-rnw-alert-gotcha`.
 *
 * Usage (component OR hook):
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Delete?', body: '…', confirmLabel: 'Delete', destructive: true })) {
 *     doTheThing();
 *   }
 */
export interface ConfirmOptions {
  title: string;
  body?: string;
  /** Confirm-button label. Default "Confirm". */
  confirmLabel?: string;
  /** Cancel-button label. Default "Cancel". */
  cancelLabel?: string;
  /** Red confirm button for genuinely destructive actions (delete/remove/block). */
  destructive?: boolean;
}

export type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// Dark A·Minimal palette (matches WithdrawConfirm / LeaveWaitlistConfirm).
const BG = '#09090b';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';
const RED = '#EF4444';

/**
 * Fallback for callers rendered without a <ConfirmProvider> (e.g. an isolated
 * unit test). Correct on both platforms: web → window.confirm, native → Alert
 * (which renders fine on native). The provider, mounted at the app root, upgrades
 * this to the branded modal everywhere in the real app.
 */
const fallbackConfirm: ConfirmFn = (opts) =>
  new Promise<boolean>((resolve) => {
    if (Platform.OS === 'web') {
      const msg = [opts.title, opts.body].filter(Boolean).join('\n\n');
      resolve(typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm(msg) : true);
      return;
    }
    Alert.alert(opts.title, opts.body, [
      { text: opts.cancelLabel ?? 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: opts.confirmLabel ?? 'Confirm', style: opts.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOpts(options);
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    const r = resolver.current;
    resolver.current = null;
    setOpts(null);
    r?.(result);
  }, []);

  const destructive = !!opts?.destructive;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal visible={!!opts} animationType="fade" transparent onRequestClose={() => settle(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: BG, borderRadius: 16, borderWidth: 1, borderColor: HAIRLINE, padding: 24, width: '100%', maxWidth: 340, gap: 16 }}>
            <Text className="font-serif" style={{ color: TEXT_0, fontSize: 20, lineHeight: 24 }}>{opts?.title}</Text>
            {opts?.body ? (
              <Text className="font-outfit" style={{ color: TEXT_2, fontSize: 14.5, lineHeight: 21 }}>{opts.body}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => settle(false)}
                style={{ flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE }}
              >
                <Text className="font-outfit" style={{ color: TEXT_0, fontWeight: '600', fontSize: 14 }}>{opts?.cancelLabel ?? 'Cancel'}</Text>
              </Pressable>
              <Pressable
                onPress={() => settle(true)}
                style={{ flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: destructive ? RED : ORANGE }}
              >
                <Text className="font-outfit" style={{ color: destructive ? '#fff' : ORANGE_INK, fontWeight: '700', fontSize: 14 }}>{opts?.confirmLabel ?? 'Confirm'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext) ?? fallbackConfirm;
}
