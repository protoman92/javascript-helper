import { OperatorFunction } from "rxjs";
import { filter, map } from "rxjs/operators";
import { NonNullableProps } from "../interface";

export default function <
  A extends { [x: string]: unknown },
  K extends keyof A = keyof A
>(...keys: readonly K[]) {
  const _: OperatorFunction<A | null | undefined, NonNullableProps<A, K>> = (
    obs
  ) =>
    obs.pipe(
      filter((item) => {
        if (item == null) return false;
        const keysToCheck = keys.length === 0 ? Object.keys(item) : keys;

        for (const key of keysToCheck) {
          if (item[key] == null) return false;
        }

        return true;
      }),
      map((item) => item as NonNullableProps<A, K>)
    );

  return _;
}
