import { TestScheduler } from "rxjs/testing";
import notNull from "./not_null";

describe("Not null operator", () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((a, b) => expect(a).toEqual(b));
  });

  it("Should filter out correct values", () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Setup && When && Then
      expectObservable(
        cold("a b c", { a: undefined, b: null, c: 0 }).pipe(notNull())
      ).toBe("2ms a", { a: 0 });
    });
  });
});
