import { OperatorFunction } from "rxjs";
import { filter, map } from "rxjs/operators";

export default function <A>() {
  const _: OperatorFunction<A | null | undefined, A> = (obs) =>
    obs.pipe(
      filter((item) => item != null),
      map((item) => item!)
    );

  return _;
}
