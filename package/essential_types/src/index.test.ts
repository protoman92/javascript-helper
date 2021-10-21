import { NonNullableProps } from ".";

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
