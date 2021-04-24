import {
  GenericAsyncFunction,
  InterceptorRegistry,
  Resolvable,
} from "../interface";

type InterceptorResultCombiner<FN extends GenericAsyncFunction> = (
  args: Readonly<{
    originalArguments: Parameters<FN>;
    nextResult: InterceptorRegistry.InterceptorResult<FN>;
    previousResult: InterceptorRegistry.InterceptorResult<FN>;
  }>
) => InterceptorRegistry.InterceptorResult<FN>;

type InterceptorRegistryArgs<
  FN extends GenericAsyncFunction
> = FN extends GenericAsyncFunction<infer T>
  ? T extends Resolvable<void>
    ? { resultCombiner?: undefined }
    : { resultCombiner: InterceptorResultCombiner<FN> }
  : {};

export default function <FN extends GenericAsyncFunction>({
  resultCombiner = (() => {}) as any,
}: InterceptorRegistryArgs<FN>): InterceptorRegistry<FN> {
  const interceptors: InterceptorRegistry.Interceptor<FN>[] = [];

  return {
    addInterceptor: (interceptor) => {
      interceptors.push(interceptor);
    },
    intercept: async (...originalArguments) => {
      let currentResult: InterceptorRegistry.InterceptorResult<FN> | undefined;

      for (const interceptor of interceptors) {
        const nextResult = await interceptor({
          originalArguments,
          previousResult: currentResult,
        });

        if (currentResult == null) {
          currentResult = nextResult;
        } else {
          currentResult = await resultCombiner({
            originalArguments,
            nextResult,
            previousResult: currentResult,
          });
        }
      }

      return currentResult;
    },
    /** Only use this for typechecking - never to produce any result */
    interceptorType: (() => {}) as FN,
    removeInterceptor: (interceptor) => {
      const index = interceptors.findIndex((i) => i === interceptor);
      if (index < 0) return;
      interceptors.splice(index, 1);
    },
  };
}
