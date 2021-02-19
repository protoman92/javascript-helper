import { GenericObject as O } from ".";

export namespace I18N {
  export type LocaleContent = { [x: string]: string | LocaleContent };
  export type TemplateReplacement = Record<string, unknown>;
}

/**
 * Represents an i18n client that has a type-checked translate method. The
 * types will force keys to be entered until they resolve to a string.
 * The level of nest depends on the translation object. If necessary, we can
 * add more nested key types.
 */
export interface I18N<T extends I18N.LocaleContent> {
  t<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3]
  >(
    ...keys: [
      ...(T extends O
        ? [
            K1,
            ...(T[K1] extends O
              ? [
                  K2,
                  ...(T[K1][K2] extends O
                    ? [
                        K3,
                        ...(T[K1][K2][K3] extends O
                          ? [K4]
                          : Partial<[I18N.TemplateReplacement]>)
                      ]
                    : Partial<[I18N.TemplateReplacement]>)
                ]
              : Partial<[I18N.TemplateReplacement]>)
          ]
        : Partial<[I18N.TemplateReplacement]>)
    ]
  ): string;

  t<
    K1 extends Extract<keyof T, string>,
    K2 extends Extract<keyof T[K1], string>,
    K3 extends Extract<keyof T[K1][K2], string>,
    K4 extends Extract<keyof T[K1][K2][K3], string>
  >(
    key: T extends O
      ? `${K1}${T[K1] extends O
          ? `.${K2}${T[K1][K2] extends O
              ? `.${K3}${T[K1][K2][K3] extends O ? `.${K4}` : ""}`
              : ""}`
          : ""}`
      : "",
    replacement?: I18N.TemplateReplacement
  ): string;

  t<K extends string>(
    rawKey: K extends keyof T ? never : K,
    replacement?: I18N.TemplateReplacement
  ): string;
}
