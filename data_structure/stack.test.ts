import Stack from "./stack";

describe("Stack", () => {
  it("Stack should work correctly", async () => {
    // Setup
    const originalArray = [1, 2, 3];
    const stack = Stack(...originalArray);

    // When
    expect(stack.peek()).toEqual(3);
    expect(stack.toArray()).toEqual(originalArray);
    expect(stack.pop()).toEqual(3);
    expect(stack.toArray()).toEqual([1, 2]);
    stack.push(4);
    expect(stack.peek()).toEqual(4);
    expect(stack.toArray()).toEqual([1, 2, 4]);
  });
});
