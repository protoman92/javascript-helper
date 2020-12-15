import { MonoTypeOperatorFunction } from "rxjs";
import { delay, retryWhen, scan, tap } from "rxjs/operators";

export default function <A>({
  delayMs,
  retryCount,
}: Readonly<{ delayMs: number; retryCount: number }>) {
  const _: MonoTypeOperatorFunction<A> = (source) =>
    source.pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((acc, error) => ({ count: acc.count + 1, error }), {
            count: 0,
            error: undefined as any,
          }),
          tap((current) => {
            if (current.count > retryCount) {
              throw current.error;
            }
          }),
          delay(delayMs)
        )
      )
    );

  return _;
}
