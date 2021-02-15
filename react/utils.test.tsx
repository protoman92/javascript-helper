import { getClassName } from "./utils";

describe("React utilities", () => {
  it("Get class name should work", async () => {
    // Setup
    const className = getClassName(
      "a",
      true && "b",
      false && "c",
      undefined && "d",
      null && "e"
    );

    // When
    // Then
    expect(className).toEqual("a b");
  });
});
