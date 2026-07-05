import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (mounted) setRm(v); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setRm);
    return () => { mounted = false; sub.remove(); };
  }, []);
  return rm;
}
