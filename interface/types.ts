import { NonNullableProps } from "./essentials";
import { PeerMessageCompatible } from "./peer";

describe("Essential types", () => {
  it("Non nullable props should work", async () => {
    // Setup
    type A = { a?: number; b?: { a?: number; b?: { a?: number } } };
    type B = NonNullableProps<A>;
    type C = NonNullableProps<A, "a">;

    // When
    const b: B = { a: 1, b: {} };
    const c: C = { a: 1 };

    // Then
    expect(b.b).toBeTruthy();
    expect(c.a).toBeTruthy();
  });
});

describe("Peer types", () => {
  it("Peer message compatible type should work", async () => {
    // Setup
    type A = Map<
      string,
      { a: Set<number>; b: { c: Set<string>; d: number[] } }
    >;

    const a: PeerMessageCompatible<A> = {
      a: { a: [1], b: { c: ["a"], d: [2] } },
    };

    // Then
    expect(a["a"].a).toBeInstanceOf(Array);
    expect(a["a"].b.c).toBeInstanceOf(Array);
    expect(a["a"].b.d).toBeInstanceOf(Array);
  });
});
