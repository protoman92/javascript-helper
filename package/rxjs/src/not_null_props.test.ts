import { TestScheduler } from "rxjs/testing";
import notNullProps from "./not_null_props";

describe("Not null props operator", () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((a, b) => expect(a).toEqual(b));
  });

  it("Should filter out correct values", () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Setup && When && Then
      expectObservable(
        cold("a b c d", {
          a: undefined,
          b: null,
          c: {
            k1: undefined as string | undefined,
            k2: null as string | null,
            k3: 1,
          },
          d: {
            k1: 1,
            k2: null as string | null,
            k3: 1,
          },
        }).pipe(notNullProps("k1"))
      ).toBe("3ms a", { a: { k1: 1, k2: null, k3: 1 } });
    });
  });
});
