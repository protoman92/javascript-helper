export default function <FN extends (...args: any) => any>(fn: FN): FN {
  let result: ReturnType<FN>;
  let executed = false;

  return ((...args: any[]) => {
    if (!executed) {
      executed = true;
      result = fn(...args);
    }

    return result;
  }) as FN;
}
