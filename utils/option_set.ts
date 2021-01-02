export default function _<Option extends string>(
  ...allOptions: readonly (Option | Record<Option, number>)[]
) {
  let flags: Record<string, number> = {};

  for (let index = 0; index < allOptions.length; index += 1) {
    const optionNameOrMap = allOptions[index];

    if (typeof optionNameOrMap === "string") {
      flags[optionNameOrMap] = 1 << index;
    } else {
      flags = { ...flags, ...optionNameOrMap };
    }
  }

  const optionSet = {
    option: (option: Option) => ({
      includes: (option2: Option) => (flags[option] & flags[option2]) > 0,
      toString: flags[option].toString.bind(flags[option]),
      value: () => flags[option],
    }),
    options: () => {
      return (Object.keys(flags) as Option[]).map((o) => optionSet.option(o));
    },
    optionMap: () => ({ ...flags }),
    withCompoundOption: <NewOption extends string>({
      fromOptions,
      newOption,
    }: Readonly<{
      fromOptions: readonly [Option, ...Option[]];
      newOption: NewOption;
    }>) => {
      let newOptionValue = 1;

      for (const fromOption of fromOptions) {
        newOptionValue = newOptionValue | flags[fromOption];
      }

      return _<Option | NewOption>(flags, {
        [newOption]: newOptionValue,
      } as Record<Option | NewOption, number>);
    },
  };

  return optionSet;
}
