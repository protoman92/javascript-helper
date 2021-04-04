import { stripLeadingSlash } from ".";

describe("General utilities", () => {
  it("Strip leading slashes should work correctly", async () => {
    // Setup
    // When
    // Then
    expect(stripLeadingSlash("////abc")).toEqual("abc");
  });
});
