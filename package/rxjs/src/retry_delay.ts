import { iif, MonoTypeOperatorFunction, throwError, timer } from "rxjs";
import { concatMap, retryWhen, take } from "rxjs/operators";

export default function <A>({
  delayMs,
  retryCount,
}: Readonly<{ delayMs: number; retryCount: number }>) {
  const _: MonoTypeOperatorFunction<A> = (source) =>
    source.pipe(
      retryWhen((errors) =>
        errors.pipe(
          concatMap((error, index) =>
            iif(
              () => index > retryCount,
              throwError(error),
              timer(delayMs).pipe(take(1))
            )
          )
        )
      )
    );

  return _;
}
