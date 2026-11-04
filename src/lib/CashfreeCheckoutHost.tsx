import React, { useEffect, useRef, useState } from 'react';
import CashfreeCheckoutModal from './CashfreeCheckoutModal';
import { registerCashfreeHost, CASHFREE_MODE } from './eventCheckout';

/**
 * Mounted once at the app root. Bridges the imperative openEventCheckout() to a single
 * Cashfree checkout modal, so call sites keep their `await openEventCheckout(...)`
 * ergonomics and we never stack nested payment modals.
 */
export default function CashfreeCheckoutHost() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const doneRef = useRef<((ok: boolean, err?: string) => void) | null>(null);

  useEffect(
    () =>
      registerCashfreeHost((sid, done) => {
        doneRef.current = done;
        setSessionId(sid);
      }),
    [],
  );

  if (!sessionId) return null;

  const handleResult = (ok: boolean, err?: string) => {
    const done = doneRef.current;
    doneRef.current = null;
    setSessionId(null);
    done?.(ok, err);
  };

  return <CashfreeCheckoutModal paymentSessionId={sessionId} mode={CASHFREE_MODE} onResult={handleResult} />;
}
