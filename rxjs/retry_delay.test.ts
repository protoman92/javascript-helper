import { TestScheduler } from "rxjs/testing";
import retryDelay from "./retry_delay";

describe("Retry delay operator", () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((a, b) => expect(a).toEqual(b));
  });

  it("Should delay retries", () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Setup && When && Then
      expectObservable(
        cold("#", {}).pipe(retryDelay({ delayMs: 1, retryCount: 3 }))
      ).toBe("3ms #", {});
    });
  });
});
