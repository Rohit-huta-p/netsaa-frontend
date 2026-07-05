import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoHideControls(active: boolean, hideMs = 3000) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  const arm = useCallback(() => {
    clear();
    if (active) timer.current = setTimeout(() => setVisible(false), hideMs);
  }, [active, hideMs]);

  const reveal = useCallback(() => { setVisible(true); arm(); }, [arm]);

  useEffect(() => {
    if (active) { setVisible(true); arm(); } else { clear(); setVisible(true); }
    return clear;
  }, [active, arm]);

  return { visible, reveal };
}
