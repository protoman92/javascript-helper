import {
  GenericAsyncFunction,
  Mapper,
} from "@haipham/javascript-helper-essential-types";

/**
 * Wrap a client's methods with a higher-order function to provide additional
 * functionalities. This should take care of both key-value object clients and
 * object/class instances.
 */
export function decorateClientMethods<
  Client,
  MethodName extends NonNullable<
    {
      [Key in keyof Client]: Client[Key] extends GenericAsyncFunction
        ? Key
        : undefined;
    }[keyof Client]
  > = NonNullable<
    {
      [Key in keyof Client]: Client[Key] extends GenericAsyncFunction
        ? Key
        : undefined;
    }[keyof Client]
  >
>({
  decorator,
  methodNames,
}: Readonly<{
  decorator: Mapper<Client[MethodName]>;
  methodNames?: MethodName[];
}>): Mapper<Client, Readonly<{ [Key in keyof Client]: Client[Key] }>> {
  return (client) => {
    let clientPrototype = Object.getPrototypeOf(client);
    let referenceInstance: any;

    if (clientPrototype === Object.prototype) {
      referenceInstance = client;
    } else {
      referenceInstance = clientPrototype;
    }

    if (methodNames == null) {
      let clientPrototype = Object.getPrototypeOf(client);

      if (clientPrototype === Object.prototype) {
        methodNames = Object.keys(client) as MethodName[];
      } else {
        methodNames = [
          ...Object.getOwnPropertyNames(clientPrototype),
          /** Take care of arrow methods in class instances */
          ...Object.keys(client),
        ] as MethodName[];
      }
    }

    const clientClone: Partial<Client> = {};

    for (const methodName of methodNames) {
      if (methodName === "constructor") {
        continue;
      }

      const propertyDescriptor =
        Object.getOwnPropertyDescriptor(referenceInstance, methodName) ??
        /** Take care of arrow methods in class instances */
        Object.getOwnPropertyDescriptor(client, methodName);

      if (propertyDescriptor == null) {
        continue;
      }

      let newPropertyDescriptor = propertyDescriptor;

      if (typeof propertyDescriptor.value === "function") {
        newPropertyDescriptor = {
          ...propertyDescriptor,
          value: (
            decorator(
              propertyDescriptor.value as Client[MethodName]
            ) as Function
          ).bind(client),
        };
      } else {
        newPropertyDescriptor = {
          ...propertyDescriptor,
          ...("get" in propertyDescriptor
            ? {
                get: propertyDescriptor.get?.bind(client),
                set: propertyDescriptor.set?.bind(client),
              }
            : {}),
        };
      }

      Object.defineProperty(clientClone, methodName, newPropertyDescriptor);
    }

    return clientClone as Client;
  };
}
