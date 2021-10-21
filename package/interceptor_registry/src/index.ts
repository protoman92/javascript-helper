import {
  GenericAsyncFunction,
  Promised,
  Resolvable,
} from "@haipham/javascript-helper-essential-types";

export namespace InterceptorRegistry {
  export type InterceptorResult<FN extends GenericAsyncFunction> = Partial<
    Promised<ReturnType<FN>>
  >;

  export type Interceptor<FN extends GenericAsyncFunction> = (
    args: Readonly<{
      originalArguments: Parameters<FN>;
      previousResult: Partial<Promised<ReturnType<FN>>> | undefined;
    }>
  ) => Resolvable<InterceptorResult<FN>>;
}

export interface InterceptorRegistry<FN extends GenericAsyncFunction> {
  addInterceptor(interceptor: InterceptorRegistry.Interceptor<FN>): void;
  intercept(
    ...args: Parameters<FN>
  ): Promise<InterceptorRegistry.InterceptorResult<FN> | undefined>;
  interceptorType: FN;
  removeInterceptor(interceptor: InterceptorRegistry.Interceptor<FN>): void;
}

type InterceptorResultCombiner<FN extends GenericAsyncFunction> = (
  args: Readonly<{
    originalArguments: Parameters<FN>;
    nextResult: InterceptorRegistry.InterceptorResult<FN>;
    previousResult: InterceptorRegistry.InterceptorResult<FN>;
  }>
) => InterceptorRegistry.InterceptorResult<FN>;

type InterceptorRegistryArgs<FN extends GenericAsyncFunction> =
  FN extends GenericAsyncFunction<infer T>
    ? T extends Resolvable<void>
      ? { resultCombiner?: undefined }
      : { resultCombiner: InterceptorResultCombiner<FN> }
    : {};

export function createInterceptorRegistry<FN extends GenericAsyncFunction>({
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
