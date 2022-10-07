import { chunkArrayWithPredicate } from ".";

describe("Array helpers", () => {
  it.each([
    {
      input: [1, 1, 2, 4, 3, 6, 5, 7, 8, 8, 10, 9],
      predicate: (element: number) => {
        return element % 2 === 0;
      },
      output: [[1, 1], [2, 4], [3], [6], [5, 7], [8, 8, 10], [9]],
    },
    {
      input: ["1", "1", "2", "4", "3", "6", "5", "7", "8", "8", "10", "9"],
      predicate: (element: string) => {
        return element.length > 1;
      },
      output: [
        ["1", "1", "2", "4", "3", "6", "5", "7", "8", "8"],
        ["10"],
        ["9"],
      ],
    },
  ])(
    "chunks Array with predicate correctly",
    ({ input, predicate, output }) => {
      // Setup
      // When
      // Then
      expect(chunkArrayWithPredicate(input as any, predicate as any)).toEqual(
        output
      );
    }
  );
});
