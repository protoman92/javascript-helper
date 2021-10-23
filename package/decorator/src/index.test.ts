import { Mapper } from "@haipham/javascript-helper-essential-types";
import { compose } from "@haipham/javascript-helper-utils";
import { decorateClientMethods } from ".";

describe("Decorate client methods", () => {
  const methodDecorator: Mapper<any, any> = (fn) => {
    return function (...args: any[]) {
      // @ts-ignore
      return fn.call(this, ...args);
    };
  };

  it("Should decorate object instance methods correctly", async () => {
    // Setup
    function Client() {
      // @ts-ignore
      this.raw1 = 1;
    }

    Client.prototype.method1 = function () {
      return this;
    };

    Client.prototype.method2 = function () {
      return 2;
    };

    Object.defineProperty(Client.prototype, "property1", {
      get: function () {
        return this;
      },
    });

    Object.defineProperty(Client.prototype, "property2", {
      get: function () {
        return () => {
          return this;
        };
      },
    });

    Object.defineProperty(Client.prototype, "property3", {
      get: function () {
        return function () {
          // @ts-ignore
          return this;
        };
      },
    });

    // When
    // @ts-ignore
    const client = new Client();

    const clientClone = decorateClientMethods<any>({
      decorator: methodDecorator,
    })(client);

    // Then
    expect(clientClone.raw1).toEqual(1);
    expect(clientClone.property1).toStrictEqual(client);
    expect(clientClone.property2()).toStrictEqual(client);
    expect(clientClone.property3()).toStrictEqual(clientClone);
    expect(clientClone.method1()).toStrictEqual(client);
    expect(clientClone.method2()).toStrictEqual(2);
    expect(
      clientClone["_javascript-utilities-decorator-originalClient"]
    ).toStrictEqual(client);
    expect(clientClone).toMatchSnapshot();
  });

  it("Should decorate class instance methods correctly", async () => {
    // Setup
    class Client {
      raw1 = 1;

      get property1() {
        return this;
      }

      get property2() {
        return () => {
          return this;
        };
      }

      get property3() {
        return function () {
          // @ts-ignore
          return this;
        };
      }

      method1() {
        return this;
      }

      method2 = () => {
        return this;
      };
    }
    // When
    const client = new Client();

    const clientClone = decorateClientMethods<typeof client>({
      decorator: methodDecorator,
    })(client);

    // Then
    expect(clientClone.raw1).toEqual(1);
    expect(clientClone.property1).toStrictEqual(client);
    expect(clientClone.property2()).toStrictEqual(client);
    expect(clientClone.property3()).toStrictEqual(clientClone);
    expect(clientClone.method1()).toStrictEqual(client);
    expect(clientClone.method2()).toStrictEqual(client);
    expect(
      clientClone["_javascript-utilities-decorator-originalClient"]
    ).toStrictEqual(client);
    expect(clientClone).toMatchSnapshot();
  });

  it("Should decorate key-value object methods correctly", async () => {
    // Setup
    const client = {
      raw1: 1,
      get property1() {
        return this;
      },
      get property2() {
        return () => {
          return this;
        };
      },
      get property3() {
        return function () {
          // @ts-ignore
          return this;
        };
      },
      method1: function () {
        return this;
      },
      method2: () => {
        return this;
      },
    };

    // When
    const clientClone = decorateClientMethods<typeof client>({
      decorator: methodDecorator,
    })(client);

    // Then
    expect(clientClone.raw1).toEqual(1);
    expect(clientClone.property1).toStrictEqual(client);
    expect(clientClone.property2()).toStrictEqual(client);
    expect(clientClone.property3()).toStrictEqual(clientClone);
    expect(clientClone.method1()).toStrictEqual(client);
    expect(clientClone.method2()).toStrictEqual(this);
    expect(
      clientClone["_javascript-utilities-decorator-originalClient"]
    ).toStrictEqual(client);
    expect(clientClone).toMatchSnapshot();
  });

  it("Should only decorate specified methods", async () => {
    // Setup
    const client = {
      get property1() {
        return 1;
      },
      method1: function () {
        return 1;
      },
      method2: () => {
        return 1;
      },
    };

    // When
    const clientClone = decorateClientMethods<typeof client>({
      decorator: () => {
        return function decorated() {
          return 2;
        };
      },
      methodNames: ["method1"],
    })(client);

    // Then
    expect(clientClone.method1()).toEqual(2);
    expect(clientClone.method2()).toEqual(1);
    expect(clientClone).toMatchSnapshot();
  });

  it("Should retain original client and bind to it", async () => {
    // Setup
    class Client {
      get property1() {
        return 3;
      }

      method1(args: number) {
        return this.property1 + args;
      }
    }

    // When
    const client = new Client();

    const clientClone = compose(
      decorateClientMethods<typeof client>({
        decorator: (fn) => {
          return function d1(this: typeof client, ...args) {
            return fn.call(this, ...args) + this.property1 * 2;
          };
        },
      }),
      decorateClientMethods<typeof client>({
        decorator: (fn) => {
          return function d2(this: typeof client, ...args) {
            return fn.call(this, ...args) * 4 + this.property1;
          };
        },
      }),
      decorateClientMethods<typeof client>({
        decorator: (fn) => {
          return function d3(this: typeof client, ...args) {
            return fn.call(this, ...args) - 1;
          };
        },
      })
    )(client);

    // Then
    expect(
      clientClone["_javascript-utilities-decorator-originalClient"]
    ).toStrictEqual(client);
    expect(clientClone.method1(2)).toEqual((2 + 3 + 6) * 4 + 3 - 1);
  });
});
