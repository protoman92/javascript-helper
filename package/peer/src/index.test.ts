import { deserializePeerMessage, serializePeerMessage } from ".";
import { PeerMessageCompatible } from "./interface";

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

describe("Serializer and deserializer for peer message", () => {
  it("Serializer and deserializer should work correctly", async () => {
    // Setup
    const message = new Set([
      new Map([
        [
          "a",
          {
            a: {
              a: new Map([
                ["a", 1],
                ["b", 2],
                ["c", undefined],
                ["d", null],
              ]),
            },
          },
        ],
        ["b", { b: { b: new Set(["a", "b", undefined, null]) } }],
        ["c", { c: { c: 1 } }],
        ["d", { d: { d: "1" } }],
        ["e", { e: { e: undefined } }],
        ["f", { f: { f: null } }],
      ]),
    ]);

    // When
    const serialized = serializePeerMessage(message);
    const deserialized = deserializePeerMessage<typeof message>(serialized);

    // Then
    expect(deserialized).toEqual(message);
    expect(JSON.parse(JSON.stringify(message))).not.toEqual(serialized);
  });
});
