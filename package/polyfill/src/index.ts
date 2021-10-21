import applySetTimeoutPolyfill from "./set_timeout";

export default function (global = window) {
  applySetTimeoutPolyfill(global);
}
