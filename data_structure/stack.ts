import { Stack } from "../interface";

export default function <T>(...source: T[] | readonly T[]): Stack<T> {
  const backingArray = source.slice();

  return {
    peek: (): T | undefined => backingArray[backingArray.length - 1],
    pop: (): T | undefined =>
      backingArray.splice(backingArray.length - 1, 1)[0],
    push: (element: T) => backingArray.push(element),
    toArray: () => backingArray.slice(),
  };
}
