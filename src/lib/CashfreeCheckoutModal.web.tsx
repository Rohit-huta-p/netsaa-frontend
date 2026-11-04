import { useEffect } from 'react';

interface Props {
  paymentSessionId: string;
  mode: 'sandbox' | 'production';
  onResult: (ok: boolean, err?: string) => void;
}

const CF_SDK = 'https://sdk.cashfree.com/js/v3/cashfree.js';

/** Load the Cashfree v3 JS SDK once (exposes the global `Cashfree`). */
function ensureSdk(): Promise<any> {
  const g: any = globalThis as any;
  return new Promise((resolve, reject) => {
    if (g.Cashfree) return resolve(g.Cashfree);
    const doc: any = g.document;
    if (!doc) return reject(new Error('Cashfree SDK unavailable'));
    let s: any = doc.getElementById('cashfree-sdk');
    if (!s) {
      s = doc.createElement('script');
      s.id = 'cashfree-sdk';
      s.src = CF_SDK;
      s.async = true;
      doc.head.appendChild(s);
    }
    s.addEventListener('load', () => resolve(g.Cashfree));
    s.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')));
  });
}

/**
 * Web Cashfree checkout — the v3 JS SDK renders its own modal (`redirectTarget: '_modal'`),
 * so this component itself renders nothing. Metro resolves CashfreeCheckoutModal.tsx
 * (the WebView variant) on native.
 */
export default function CashfreeCheckoutModal({ paymentSessionId, mode, onResult }: Props) {
  useEffect(() => {
    let cancelled = false;
    ensureSdk()
      .then((Cashfree: any) => {
        if (cancelled) return;
        const cf = Cashfree({ mode });
        return cf.checkout({ paymentSessionId, redirectTarget: '_modal' }).then((res: any) => {
          if (cancelled) return;
          if (res && res.error) onResult(false, res.error.message || 'Payment failed');
          else onResult(true);
        });
      })
      .catch((e: any) => {
        if (!cancelled) onResult(false, e?.message || 'Checkout failed');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSessionId, mode]);

  return null;
}
