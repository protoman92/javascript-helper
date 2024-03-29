/** Set timeout polyfill to accept large values */
// @ts-ignore
export default function (global: Pick<typeof window, "setTimeout"> = window) {
  const MAX_DELAY = Math.pow(2, 31) - 1;
  const _setTimeout = global.setTimeout;

  global.setTimeout = ((
    ...[handler, timeout, ...args]: Parameters<typeof _setTimeout>
  ) => {
    if (!timeout || (timeout as number) <= MAX_DELAY) {
      return _setTimeout(handler, timeout, ...args);
    }

    return _setTimeout(handler, MAX_DELAY, ...args);
  }) as typeof _setTimeout;
}
