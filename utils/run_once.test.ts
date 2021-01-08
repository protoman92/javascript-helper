import runOnce from "./run_once";

describe("Run once", () => {
  it("Should run function only once", async () => {
    // Setup
    let callCount = 0;

    const fn = runOnce(async () => {
      callCount += 1;
      return callCount;
    });

    // When && Then
    const result1 = await fn();
    const result2 = await fn();
    expect(result1).toEqual(1);
    expect(result2).toEqual(1);
  });
});
