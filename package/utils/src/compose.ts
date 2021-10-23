import { Mapper } from "@haipham/javascript-helper-essential-types";

interface Compose {
  <T, HFN extends Mapper<T> = Mapper<T>>(
    ...hfns: readonly [HFN, ...HFN[]]
  ): HFN;
  <HFN extends Mapper<any>>(...hfns: readonly [HFN, ...HFN[]]): HFN;
}

/**
 * Compose a series of higher-order functions together into one single higher-
 * order function.
 */
export default (function compose<T, HFN extends Mapper<T> = Mapper<T>>(
  ...hfns: readonly [HFN, ...HFN[]]
): HFN {
  let finalFn = hfns[0];

  for (let index = 1; index < hfns.length; index += 1) {
    const _lastHfn = finalFn;
    const hfn = hfns[index];

    finalFn = ((fn) => {
      return hfn(_lastHfn(fn));
    }) as HFN;
  }

  return finalFn;
} as Compose);
