// Whether the page was opened in the check mode (`?perf`, 06-web 9). Kept apart from the check
// mode itself, which `main.tsx` fetches only when this says yes.

/** `?perf` (with or without a value, among other parameters) opens the check mode. */
export function isPerfMode(search: string): boolean {
  return new URLSearchParams(search).has('perf');
}
