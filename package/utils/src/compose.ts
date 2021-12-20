import { Mapper } from "@haipham/javascript-helper-essential-types";

interface Compose {
  <T, HFN extends Mapper<T> = Mapper<T>>(
    ...hfns: readonly [HFN, ...HFN[]]
  ): HFN;
  <HFN extends Mapper<any>>(...hfns: readonly HFN[]): HFN;
}

/**
 * Compose a series of higher-order functions together into one single higher-
 * order function.
 */
export default (function compose<T, HFN extends Mapper<T> = Mapper<T>>(
  ...hfns: readonly HFN[]
): HFN {
  let finalFn: HFN = ((args) => {
    return args;
  }) as HFN;

  for (const hfn of hfns) {
    const _lastHfn = finalFn;

    finalFn = ((args) => {
      return hfn(_lastHfn(args));
    }) as HFN;
  }

  return finalFn;
} as Compose);
