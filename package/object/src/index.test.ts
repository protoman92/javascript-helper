import { flattenDeepObject, isKeyValueObjectType, omitDeep, omitNull } from ".";

describe("Object utilities", () => {
  it("Omit deep should work correctly", () => {
    // Setup
    expect(
      omitDeep({ a: 1, b: { a: 1, c: { a: 1, b: 2, d: 3 } } }, "a", "d")
    ).toMatchSnapshot();

    expect(omitDeep(1 as any, "a")).toMatchSnapshot();
    expect(omitDeep([1, 2, 3], "a")).toMatchSnapshot();

    expect(
      omitDeep([1, 2, { a: { a: {} }, b: { a: 1 } }], "a")
    ).toMatchSnapshot();

    expect(
      omitDeep(new Set([{ a: 1, b: new Set([{ a: 1 }]) }, { b: 2 }]), "a")
    ).toMatchSnapshot();

    expect(
      omitDeep(
        new Map([
          ["key1", { a: 1, b: new Map([["key3", { a: 2 }]]) }],
          ["key2", { b: 2 }],
        ]),
        "a"
      )
    ).toMatchSnapshot();

    expect(omitDeep(new Date(), "a")).toBeInstanceOf(Date);
    expect(omitDeep(null, "a")).toEqual(null);
    expect(omitDeep(undefined, "a")).toEqual(undefined);
  });

  it("Omit null should work both arrays and key-value objects", () => {
    // Setup
    expect(omitNull([1, 2, undefined, 3, null, 4])).toEqual([1, 2, 3, 4]);
    expect(omitNull({ a: null, b: undefined, c: 3, d: 4 })).toEqual({
      c: 3,
      d: 4,
    });
  });

  it("Flatten deep should work correctly", () => {
    // Setup
    // When
    const flattened = flattenDeepObject({
      a: { b: { c: "1" } },
      b: { c: [2] },
      c: { d: { e: false } },
    });

    // Then
    expect(flattened).toEqual({ "a.b.c": "1", "b.c": [2], "c.d.e": false });
  });

  it("Should check and validate key-value object type correctly", () => {
    // Setup
    const object = { a: false, b: 2 };

    // When
    const validated = isKeyValueObjectType<typeof object>(object, {
      a: {
        validator: (...[, value]) => {
          return value === true;
        },
      },
      b: {
        validator: (...[, value]) => {
          return value === 1;
        },
      },
    });

    // When
    expect(validated).toEqual(false);
  });
});
