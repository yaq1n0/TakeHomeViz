import { onBeforeUnmount, ref, type Ref } from 'vue';

/**
 * Reactive wrapper around `window.matchMedia`.
 *
 * Returns a `Ref<boolean>` that tracks whether the given media query currently
 * matches. Listens for changes and cleans up on component unmount. Safe to
 * call during SSR — defaults to `false` when `window` is unavailable.
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref<boolean>(false);
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return matches;
  }
  const mql = window.matchMedia(query);
  matches.value = mql.matches;
  const onChange = (e: MediaQueryListEvent): void => {
    matches.value = e.matches;
  };
  // Safari < 14 uses deprecated addListener.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    onBeforeUnmount(() => mql.removeEventListener('change', onChange));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mql as any).addListener(onChange);
    onBeforeUnmount(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mql as any).removeListener(onChange);
    });
  }
  return matches;
}
