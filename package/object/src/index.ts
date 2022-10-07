import { DeepWritable, Writable } from "ts-essentials";

type DeepValueOf<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? DeepValueOf<T[K]>
    : T[K];
}[keyof T];

export function flattenDeepObject<T extends Record<string, unknown>>(args: T) {
  const result: Record<string, unknown> = {};

  for (const key in args) {
    let intermediateValue = args[key];

    if (isKeyValueObject(intermediateValue)) {
      const flattenedChild: Record<string, unknown> =
        flattenDeepObject(intermediateValue);

      for (const childKey in flattenedChild) {
        result[`${key}.${childKey}`] = flattenedChild[childKey];
      }
    } else {
      result[key] = intermediateValue;
    }
  }

  return result as Record<string, DeepValueOf<T>>;
}

export function isKeyValueObject(
  args: unknown
): args is Record<string, unknown> {
  return Object.prototype.toString.call(args) === "[object Object]";
}

interface IKeyOf {
  <T, K extends keyof T = keyof T>(key: K): typeof key;
  <T, K extends keyof T>(args: T, key: K): typeof key;
}

export const keyof: IKeyOf = ((args1: any, args2 = args1) => {
  return args2;
}) as IKeyOf;

interface IKeyOfArray {
  <TArr extends any[], K extends keyof TArr[number]>(
    args: TArr | undefined,
    key: K
  ): typeof key;
  <TArr extends readonly any[], K extends keyof TArr[number]>(
    args: TArr | undefined,
    key: K
  ): typeof key;
}

export const keyofArray: IKeyOfArray = ((args1: any, args2 = args1) => {
  return args2;
}) as IKeyOfArray;

export function omit<T, K extends keyof NonNullable<T>>(
  obj: T,
  ...keys: readonly K[]
): null extends T
  ? null
  : undefined extends T
  ? undefined
  : T extends object
  ? Omit<NonNullable<T>, K>
  : null {
  if (obj == null) {
    return obj as any;
  }

  if (typeof obj !== "object") {
    return null as any;
  }

  const objClone: Partial<T> = {};
  const keySet = new Set<keyof NonNullable<T>>(keys);

  for (const objKey in obj) {
    if (keySet.has(objKey as keyof T)) {
      continue;
    }

    objClone[objKey] = obj[objKey];
  }

  return objClone as any;
}

export const omitDeep = (() => {
  function isObject(obj: any): obj is {} {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  return <T>(obj: T, ...keys: string[]): T => {
    if (obj == null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((element) => omitDeep(element, ...keys)) as any;
    }

    if (obj instanceof Map) {
      return new Map(
        [...obj.entries()].map(([key, value]) => [
          key,
          omitDeep(value, ...keys),
        ])
      ) as any;
    }

    if (obj instanceof Set) {
      return new Set(omitDeep([...obj.values()], ...keys)) as any;
    }

    if (!isObject(obj)) return obj;
    const objClone: any = omit<any, any>(obj, ...keys);

    for (const key in objClone) {
      objClone[key] = omitDeep(objClone[key], ...keys);
    }

    return objClone;
  };
})();

export function omitFalsy<T extends { [x: string]: any }>(obj: T): Partial<T> {
  const newObject: Partial<T> = {};

  for (const key in obj) {
    if (!obj[key]) continue;
    newObject[key] = obj[key];
  }

  return newObject;
}

interface OmitNull {
  <T extends { [Key: string]: any }>(obj: T): {
    [Key in keyof T]: T[Key] extends NonNullable<T[Key]>
      ? T[Key]
      : NonNullable<T[Key]> | undefined;
  };
  <T>(arr: (T | null | undefined)[]): T[];
  <T>(arr: readonly (T | null | undefined)[]): readonly T[];
}

export const omitNull: OmitNull = ((args1: any) => {
  if (Array.isArray(args1)) {
    return args1.filter((args2) => {
      return args2 != null;
    });
  }

  const newObject: typeof args1 = {};

  for (const key in args1) {
    if (args1[key] == null) {
      continue;
    }

    newObject[key] = args1[key];
  }

  return newObject;
}) as OmitNull;

interface PickFunction {
  <T, K extends keyof T>(arr: T[], ...keys: readonly K[]): Pick<T, K>[];

  <T, K extends keyof T>(
    arr: readonly T[],
    ...keys: readonly K[]
  ): readonly Pick<T, K>[];

  <T, K extends keyof T>(obj: T, ...keys: readonly K[]): Pick<T, K>;
}

export const pick = function <T, K extends keyof T>(
  objOrArr: T | T[],
  ...keys: readonly K[]
) {
  if (objOrArr instanceof Array) {
    return objOrArr.map((obj) => pick(obj, ...keys));
  }

  return keys.reduce((acc, k) => Object.assign(acc, { [k]: objOrArr[k] }), {});
} as PickFunction;

export function typedValue<T>(args: T): T {
  return args;
}

export function deepWritable<T>(args: T): DeepWritable<T> {
  return args as DeepWritable<T>;
}

export function writable<T>(args: T): Writable<T> {
  return args as Writable<T>;
}
