import { useRef, useEffect, useCallback } from "react";

interface UseIdleDetectionOptions {
  enabled: boolean;
  sessionId: string | undefined;
  idleThreshold?: number;
  cooldown?: number;
  onIdle: (idleTime: number) => Promise<void>;
}

export function useIdleDetection(options: UseIdleDetectionOptions) {
  const {
    enabled,
    sessionId,
    idleThreshold = 30,
    cooldown = 30000,
    onIdle,
  } = options;

  const lastActivityRef = useRef<number>(Date.now());
  const lastIdleCheckRef = useRef<number>(0);

  const reportActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const timer = setInterval(async () => {
      const now = Date.now();
      const idleTime = Math.floor((now - lastActivityRef.current) / 1000);

      if (idleTime >= idleThreshold && now - lastIdleCheckRef.current >= cooldown) {
        console.log(`⏰ Idle for ${idleTime}s, triggering nudge`);
        lastIdleCheckRef.current = now;
        await onIdle(idleTime);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [enabled, sessionId, idleThreshold, cooldown, onIdle]);

  return { reportActivity };
}
