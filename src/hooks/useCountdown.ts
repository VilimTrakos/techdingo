import { useEffect, useRef, useState } from 'react';

/**
 * Countdown baziran na wall-clock vremenu (Date.now()), ne na akumulaciji
 * intervala - tako ne driftа čak ni ako preglednik throttlea pozadinski tab.
 * Restarta se svaki put kad se `resetKey` promijeni (npr. indeks pitanja).
 */
export function useCountdown(durationMs: number, resetKey: unknown, active: boolean, onExpire: () => void): number {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!active) {
      setRemainingMs(durationMs);
      return;
    }

    const endAt = Date.now() + durationMs;
    let expired = false;
    setRemainingMs(durationMs);

    const tick = () => {
      const remaining = Math.max(0, endAt - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0 && !expired) {
        expired = true;
        onExpireRef.current();
      }
    };

    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [durationMs, resetKey, active]);

  return remainingMs;
}
