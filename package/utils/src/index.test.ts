import { deepClone, stripLeadingSlash } from ".";

describe("General utilities", () => {
  it("Strip leading slashes should work correctly", async () => {
    // Setup
    // When
    // Then
    expect(stripLeadingSlash("////abc")).toEqual("abc");
  });

  it("Deep clone should work correctly", () => {
    // Setup
    // When
    const deepCloned = deepClone({ a: { b: { c: { d: 1, e: "1" } } } })(
      (...[, value]) => {
        if (typeof value === "number") return value.toString();
        return value;
      },
      (...[, value]) => {
        if (typeof value === "string") return parseInt(value);
        return value;
      }
    )(
      (...[, value]) => {
        if (typeof value === "number") return value * 10;
        return value;
      },
      (...[, value]) => {
        if (typeof value === "number") return value.toString();
        return value;
      }
    );

    // Then
    expect(deepCloned).toMatchSnapshot();
  });
});
