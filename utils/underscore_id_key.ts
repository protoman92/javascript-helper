type WithUnderscoredIDKey<T> = T extends { id: any }
  ? { [x in keyof Omit<T, "id">]: WithUnderscoredIDKey<T[x]> } & {
      _id: T["id"];
    }
  : T;

/** Replace id with _id for MongoDB database operations */
export default function <T>(
  data: T,
  reviver?: (this: T, key: string, value: unknown) => unknown
): WithUnderscoredIDKey<T> {
  let stringified = JSON.stringify(data);
  stringified = stringified.replace(/"id":/g, `"_id":`);
  return JSON.parse(stringified, reviver);
}
