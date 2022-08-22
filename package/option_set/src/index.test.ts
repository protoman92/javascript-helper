import createOptionSet from ".";

describe("Option set", () => {
  it("Create option set", async () => {
    // Setup
    const optionSet = createOptionSet("a", "b", "c")
      .withCompoundOption({
        fromOptions: ["a", "b"],
        newOption: "d",
      })
      .withCompoundOption({ fromOptions: ["b", "c", "d"], newOption: "e" });

    // When && Then
    expect(optionSet.option("d").includes("a")).toBeTruthy();
    expect(optionSet.option("d").includes("b")).toBeTruthy();
    expect(optionSet.option("d").includes("c")).toBeFalsy();
    expect(optionSet.option("a").includes("b")).toBeFalsy();
    expect(optionSet.option("c").includes("b")).toBeFalsy();
    expect(optionSet.option("e").includes("d")).toBeTruthy();
    expect(optionSet.option("e").includes("a")).toBeTruthy();
  });
});
