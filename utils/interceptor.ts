import { GenericAsyncFunction, Resolvable } from "../interface";

type Interceptor<FN extends GenericAsyncFunction> = (
  args: Readonly<{
    originalArguments: Parameters<FN>;
    previousResult: ReturnType<FN> | undefined;
  }>
) => ReturnType<FN>;

type InterceptorRegistryArgs<
  FN extends GenericAsyncFunction
> = FN extends GenericAsyncFunction<infer T>
  ? T extends Resolvable<void>
    ? { resultCombiner?: undefined }
    : { resultCombiner: (previousResult: T, currentResult: T) => Resolvable<T> }
  : {};

export default function <FN extends GenericAsyncFunction>({
  resultCombiner = () => {},
}: InterceptorRegistryArgs<FN>) {
  const interceptors: Interceptor<FN>[] = [];

  return {
    addInterceptor: (interceptor: Interceptor<FN>) => {
      interceptors.push(interceptor);
    },
    intercept: async (...originalArguments: Parameters<FN>) => {
      let currentResult: ReturnType<FN> | undefined;

      for (const interceptor of interceptors) {
        const nextResult = await interceptor({
          originalArguments,
          previousResult: currentResult,
        });

        if (currentResult == null) {
          currentResult = nextResult;
        } else {
          currentResult = await resultCombiner(currentResult, nextResult);
        }
      }

      return currentResult;
    },
    /** Only use this for typechecking - never to produce any result */
    interceptorType: (() => {}) as FN,
    removeInterceptor: (interceptor: Interceptor<FN>) => {
      const index = interceptors.findIndex((i) => i === interceptor);
      if (index < 0) return;
      interceptors.splice(index, 1);
    },
  };
}
