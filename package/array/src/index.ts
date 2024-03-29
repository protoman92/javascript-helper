export type ArrayOrSingle<T> = T | T[] | readonly T[];

interface ToArray {
  <T>(elemOrArray: ArrayOrSingle<T>): T[];
}

export function chunkArrayWithPredicate<T>(
  array: T[],
  predicate: (element: T) => boolean
): [T, ...T[]][] {
  const chunks: [T, ...T[]][] = [];
  let lastPredicateResult: boolean | undefined = undefined;

  for (const element of array) {
    const lastChunk = chunks[chunks.length - 1];
    const predicateResult = Boolean(predicate(element));

    if (lastChunk == null || predicateResult !== lastPredicateResult) {
      chunks.push([element]);
    } else {
      lastChunk.push(element);
    }

    lastPredicateResult = predicateResult;
  }

  return chunks;
}

export const toArray = ((elemOrArray: ArrayOrSingle<any>) => {
  if (Array.isArray(elemOrArray)) {
    return elemOrArray;
  }

  return [elemOrArray];
}) as ToArray;

export function tuple<T1, T2>(element1: T1, element2: T2): [T1, T2] {
  return [element1, element2];
}

export function swapArrayElements<T>(
  array: T[] | readonly T[],
  i: number,
  j: number
) {
  const arrayClone = [...array];
  const iElement = arrayClone[i]!;
  arrayClone[i] = arrayClone[j]!;
  arrayClone[j] = iElement;
  return arrayClone;
}
