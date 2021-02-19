import { NonNullableProps } from "./essentials";
import { I18N } from "./i18n";
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

describe("i18n types", () => {
  it("Should have correct t methods", async () => {
    // Setup
    type LocaleContent = { a: { b: { c: string } }; b: { c: string } };
    type Client = I18N<LocaleContent>;

    // When
    const localeContent = { a: { b: { c: "1" } }, b: { c: "2" } };

    const client: Client = {
      t: (...keys: readonly (object | string)[]) => {
        let currentObject: I18N.LocaleContent = localeContent;

        if (
          keys.length === 1 &&
          typeof keys[0] === "string" &&
          keys[0].includes(".")
        ) {
          keys = keys[0].split(".");
        }

        let replacement: object | undefined;

        if (typeof keys[keys.length - 1] === "object") {
          replacement = keys[keys.length - 1] as object;
        }

        for (const key of keys) {
          if (typeof key === "object") {
            throw new Error("Wrong key");
          } else if (key in currentObject) {
            const childObject = currentObject[key];

            if (typeof childObject === "object") {
              currentObject = childObject;
            } else {
              return `${childObject}${JSON.stringify(replacement)}`;
            }
          } else {
            return `${key}${JSON.stringify(replacement)}`;
          }
        }

        throw new Error("Not found");
      },
    } as any;

    const replacement = { x: 1, y: 2, z: 3 };

    // Then
    expect(client.t("a", "b", "c", replacement)).toMatchSnapshot();
    expect(client.t("b", "c", replacement)).toMatchSnapshot();
    expect(client.t("a.b.c", replacement)).toMatchSnapshot();
    expect(client.t("whatever", replacement)).toMatchSnapshot();
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
