import { GenericObject as O } from "@haipham/javascript-helper-essential-types";

export namespace I18N {
  export type LocaleContent = { [x: string]: string | LocaleContent };

  export type Options<TOptions = {}> = Readonly<{
    replacement?: TemplateReplacement;
  }> &
    TOptions;

  export type TemplateReplacement = Record<string, unknown>;
}

type KeyArray<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3]
> = [
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
];

/**
 * Represents an i18n client that has a type-checked translate method. The
 * types will force keys to be entered until they resolve to a string.
 * The level of nest depends on the translation object. If necessary, we can
 * add more nested key types.
 * @template TOptions additional options that can be specified to work with
 * different underlying i18n implementations.
 */
export interface I18N<T extends I18N.LocaleContent, TOptions = {}> {
  k<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3]
  >(
    ...keys: KeyArray<T, K1, K2, K3, K4>
  ): typeof keys;

  t<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3]
  >(
    ...keys: [
      ...KeyArray<T, K1, K2, K3, K4>,
      ...Partial<[I18N.Options<TOptions>]>
    ]
  ): string;

  t<K extends string>(
    rawKey: K extends keyof T ? never : K,
    options?: I18N.Options<TOptions>
  ): string;
}
