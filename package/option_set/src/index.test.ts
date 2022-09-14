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

  it("Create option set with numbers", () => {
    // Setup
    const optionSet = createOptionSet<number>(1, 2, 3)
      .withCompoundOption({
        fromOptions: [1, 2],
        newOption: 4,
      })
      .withCompoundOption({ fromOptions: [3, 4], newOption: 5 });

    // When
    // Then
    expect(optionSet.option(5).includes(1)).toBeTruthy();
    expect(optionSet.option(5).includes(2)).toBeTruthy();
    expect(optionSet.option(3).includes(1)).toBeFalsy();
  });

  it("Create option set with duplicate options", () => {
    // Setup
    const optionSet = createOptionSet<number>(1, 1, 2, 2)
      .withCompoundOption({
        fromOptions: [1, 1, 2, 2],
        newOption: 3,
      })
      .withCompoundOption({ fromOptions: [1, 2, 3], newOption: 3 });

    // When
    // Then
    expect(optionSet.option(3).includes(1)).toBeTruthy();
    expect(optionSet.option(3).includes(2)).toBeTruthy();
    expect(optionSet.option(3).includes(3)).toBeTruthy();
  });
});
