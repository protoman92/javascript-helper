import { deserializePeerMessage, serializePeerMessage } from "./peer";

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
