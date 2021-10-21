import applySetTimeoutPolyfill from "./set_timeout";

// @ts-ignore
export default function (global = window) {
  applySetTimeoutPolyfill(global);
}
