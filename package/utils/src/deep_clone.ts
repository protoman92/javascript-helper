export type DeepCloneReplacer = (key: string, value: unknown) => unknown;
export type DeepCloneReviver = (key: string, value: unknown) => unknown;

export default function deepClone<T>(
  obj: T
): (
  ...replacers: readonly DeepCloneReplacer[]
) => (
  ...revivers: readonly DeepCloneReviver[]
) => undefined extends T ? T | undefined : T {
  return (...replacers) => {
    return (...revivers) => {
      const stringified = JSON.stringify(obj, (key, value) => {
        let replacedValue = value;

        for (const replacer of replacers) {
          replacedValue = replacer(key, replacedValue);
        }

        return replacedValue;
      });

      if (stringified === undefined) return undefined;

      return JSON.parse(stringified, (key, value) => {
        let revivedValue = value;

        for (const reviver of revivers) {
          revivedValue = reviver(key, revivedValue);
        }

        return revivedValue;
      });
    };
  };
}
