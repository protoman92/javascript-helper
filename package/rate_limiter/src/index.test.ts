import rateLimit from ".";

describe("Rate limiter", () => {
  it("Should prevent multiple requests within time window", async () => {
    // Setup
    const startTime = new Date().getTime();
    const elapsedTimes: number[] = [];

    // When
    const rateLimited = rateLimit((..._args: unknown[]) => {
      elapsedTimes.push(new Date().getTime() - startTime);
    }, 100);

    rateLimited(1);
    rateLimited(2);
    rateLimited(3);

    setTimeout(() => {
      rateLimited(4);
    }, 500);

    // Then
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });

    expect(elapsedTimes[0]).toBeGreaterThanOrEqual(0);
    expect(elapsedTimes[0]).toBeLessThan(100);
    expect(elapsedTimes[1]).toBeGreaterThanOrEqual(100);
    expect(elapsedTimes[1]).toBeLessThan(200);
    expect(elapsedTimes[2]).toBeGreaterThanOrEqual(200);
    expect(elapsedTimes[2]).toBeLessThan(300);
    expect(elapsedTimes[3]).toBeGreaterThanOrEqual(500);
  });
});
