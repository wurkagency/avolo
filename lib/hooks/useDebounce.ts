import { useCallback, useRef } from "react";

/**
 * Returns a debounced version of `fn` that delays invocation by `delayMs`.
 * Stable reference — safe to use in dependency arrays.
 */
export function useDebounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delayMs: number,
): (...args: T) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fn(...args);
      }, delayMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delayMs],
  );
}
