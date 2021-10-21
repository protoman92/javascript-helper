import getAllPages from "./paginate";

describe("Paginate", () => {
  it("Get all pages", async () => {
    // Setup
    let pageCount = 5;
    let callCount = 0;

    // When
    const results = await getAllPages<number>({
      checkShouldStop: (result) => result === pageCount,
      fn: async () => {
        callCount += 1;
        return callCount;
      },
    });

    // Then
    expect(results).toEqual([...Array(pageCount).keys()].map((k) => k + 1));
    expect(callCount).toEqual(5);
  });
});
