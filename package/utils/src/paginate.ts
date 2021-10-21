export default async function <Result>({
  checkShouldStop,
  fn,
}: Readonly<{
  checkShouldStop: (result: Result) => boolean;
  fn: (
    previousResult: Result | null | undefined
  ) => Promise<Result | null | undefined>;
}>) {
  const results: Result[] = [];

  while (true) {
    const result = await fn(results[results.length - 1]);
    if (result == null) break;
    results.push(result);
    if (checkShouldStop(result)) break;
  }

  return results;
}
