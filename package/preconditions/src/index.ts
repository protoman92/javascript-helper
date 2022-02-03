export function isType<T, K extends keyof T = keyof T>(
  object: unknown,
  ...keys: K[]
): object is T {
  if (typeof object !== "object" || object == null) {
    return false;
  }

  for (const key of keys) {
    if (key in object) {
      continue;
    }

    return false;
  }

  return true;
}

/** Request all values of an object to be truthy, and throw an error otherwise */
export function requireAllTruthy<T>(
  args: T
): Readonly<Required<{ [x in keyof T]: NonNullable<T[x]> }>> {
  for (const key in args) {
    if (!args[key]) {
      throw new Error(`Falsy value ${key}`);
    }
  }

  return args as any;
}

export function requireFalse(
  value: boolean | null | undefined,
  message = "Expected false value"
): false {
  if (value === false) {
    throw new Error(message);
  }

  return false;
}

export function requireTrue(
  value: boolean | null | undefined,
  message = "Expected true value"
): true {
  if (value === true) {
    throw new Error(message);
  }

  return true;
}

export function requireNotNull<T>(
  obj: T | null | undefined,
  message = "Expected non-null value"
) {
  if (obj == null) {
    throw new Error(message);
  }

  return obj;
}

export function requireNull<T>(
  obj: T | null | undefined,
  message = "Expected non-null value"
) {
  if (obj == null) {
    return;
  }

  throw new Error(message);
}

export function requireTruthy<T>(args: T, key = ""): NonNullable<T> {
  if (!!key) {
    key = `: ${key}`;
  }

  if (!args) {
    throw new Error(`Falsy value${key}`);
  }

  return args as any;
}
