import {
  GenericAsyncFunction,
  Mapper,
} from "@haipham/javascript-helper-essential-types";

/** Internal usage */
const _KEY_ORIGINAL_CLIENT =
  "_javascript-utilities-decorator-originalClient" as const;

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
}>): Mapper<
  Client,
  Readonly<
    { [Key in keyof Client]: Client[Key] } & { [_KEY_ORIGINAL_CLIENT]: Client }
  >
> {
  return (client) => {
    const clientPrototype = Object.getPrototypeOf(client);
    let referenceInstance: any;

    if (clientPrototype === Object.prototype) {
      referenceInstance = client;
    } else {
      referenceInstance = clientPrototype;
    }

    let propertyKeys: (keyof Client)[];

    if (clientPrototype === Object.prototype) {
      propertyKeys = Object.getOwnPropertyNames(client) as MethodName[];
    } else {
      propertyKeys = [
        ...Object.getOwnPropertyNames(clientPrototype),
        /** Take care of arrow methods in class instances */
        ...Object.keys(client),
      ] as MethodName[];
    }

    let methodNamesToDecorate: Set<keyof Client> | undefined;

    if (methodNames == null) {
      methodNamesToDecorate = new Set(propertyKeys);
    } else {
      methodNamesToDecorate = new Set(methodNames);
    }

    let clientToBind: any = client;

    if (propertyKeys.includes(_KEY_ORIGINAL_CLIENT as keyof Client)) {
      clientToBind = client[_KEY_ORIGINAL_CLIENT as keyof Client];
    }

    const clientClone = { [_KEY_ORIGINAL_CLIENT]: clientToBind };

    for (const propertyKey of propertyKeys) {
      if (
        propertyKey === "constructor" ||
        propertyKey === _KEY_ORIGINAL_CLIENT
      ) {
        continue;
      }

      const propertyDescriptor =
        Object.getOwnPropertyDescriptor(referenceInstance, propertyKey) ??
        /** Take care of arrow methods in class instances */
        Object.getOwnPropertyDescriptor(client, propertyKey);

      if (propertyDescriptor == null) {
        continue;
      }

      let newPropertyDescriptor = propertyDescriptor;

      if (
        typeof propertyDescriptor.value === "function" &&
        methodNamesToDecorate.has(propertyKey)
      ) {
        newPropertyDescriptor = {
          ...propertyDescriptor,
          value: (decorator(propertyDescriptor.value) as Function).bind(
            clientToBind
          ),
        };
      } else {
        newPropertyDescriptor = {
          ...propertyDescriptor,
          ...("get" in propertyDescriptor
            ? {
                get: propertyDescriptor.get?.bind(clientToBind),
                set: propertyDescriptor.set?.bind(clientToBind),
              }
            : {}),
        };
      }

      Object.defineProperty(clientClone, propertyKey, newPropertyDescriptor);
    }

    return clientClone as any;
  };
}
