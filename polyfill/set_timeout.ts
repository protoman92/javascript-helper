/** Set timeout polyfill to accept large values */
export default function (global: Pick<typeof window, "setTimeout"> = window) {
  const MAX_DELAY = Math.pow(2, 31) - 1;
  const _setTimeout = global.setTimeout;

  global.setTimeout = ((handler, timeout, ...args) => {
    if (!timeout || timeout <= MAX_DELAY) {
      return _setTimeout(handler, timeout, ...args);
    }

    return _setTimeout(handler, MAX_DELAY, ...args);
  }) as typeof _setTimeout;
}
