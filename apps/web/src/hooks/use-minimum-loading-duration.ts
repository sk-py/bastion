// hooks/use-minimum-loading-duration.ts
import { useEffect, useRef, useState } from "react";

export function useMinimumLoadingDuration(isLoading: boolean, minimumMs = 2500) {
  const [shouldShow, setShouldShow] = useState(isLoading);
  const startedAtRef = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (isLoading) {
      startedAtRef.current ??= Date.now();
      setShouldShow(true);
      return;
    }

    if (startedAtRef.current === null) {
      setShouldShow(false);
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(minimumMs - elapsed, 0);

    const timer = setTimeout(() => {
      setShouldShow(false);
      startedAtRef.current = null;
    }, remaining);

    return () => clearTimeout(timer);
  }, [isLoading, minimumMs]);

  return shouldShow;
}