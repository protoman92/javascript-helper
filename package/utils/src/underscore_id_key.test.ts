import underscoreIDKeys from "./underscore_id_key";

describe("Underscore ID key", () => {
  it("Replace ID key", async () => {
    expect(
      underscoreIDKeys(
        {
          id: 1,
          a: { id: 2, b: { id: 3, c: "Big deal" }, c: "No big deal" },
          c: `"id":`,
          d: "id:",
          ignored: "e",
        },
        (key, value) => (key === "ignored" ? undefined : value)
      )
    ).toMatchSnapshot();
  });
});
