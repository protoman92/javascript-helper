import { GenericObject as O } from ".";

export namespace I18N {
  export type Translation = { [x: string]: string | Translation };
}

/**
 * Represents an i18n client that has a type-checked translate method. The
 * types will force keys to be entered until they resolve to a string.
 * The level of nest depends on the translation object. If necessary, we can
 * add more nested key types.
 */
export interface I18N<T extends I18N.Translation> {
  t<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3]
  >(
    ...keys: [
      ...[],
      ...(T extends O
        ? [
            K1,
            ...(T[K1] extends O
              ? [
                  K2,
                  ...(T[K1][K2] extends O
                    ? [K3, ...(T[K1][K2][K3] extends O ? [K4] : [])]
                    : [])
                ]
              : [])
          ]
        : [])
    ]
  ): string;

  t<K extends string>(rawKey: K extends keyof T ? never : K): string;
}
