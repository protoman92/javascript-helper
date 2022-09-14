type ValidOptionType = number | string;

export default function createOptionSet<Option extends ValidOptionType>(
  ...allOptions: readonly (Option | Record<Option, number>)[]
) {
  let flags: Record<ValidOptionType, number> = {};

  for (let index = 0; index < allOptions.length; index += 1) {
    const optionOrMap = allOptions[index];

    if (typeof optionOrMap === "object") {
      flags = { ...flags, ...optionOrMap };
    } else {
      flags[optionOrMap] = 1 << index;
    }
  }

  function getValue(option: Option): number {
    return flags[option]!;
  }

  const optionSet = {
    option: (option: Option) => ({
      includes: (option2: Option) => {
        return (getValue(option) & getValue(option2)) > 0;
      },
      toString: getValue(option).toString.bind(getValue(option)),
      value: () => {
        return getValue(option);
      },
    }),
    options: () => {
      return (Object.keys(flags) as Option[]).map((o) => {
        return optionSet.option(o);
      });
    },
    optionMap: () => {
      return { ...flags };
    },
    withCompoundOption: <NewOption extends ValidOptionType>({
      fromOptions,
      newOption,
    }: Readonly<{
      fromOptions: readonly [Option, ...Option[]];
      newOption: NewOption;
    }>) => {
      let newOptionValue = 1;

      for (const fromOption of fromOptions) {
        newOptionValue = newOptionValue | getValue(fromOption);
      }

      return createOptionSet<Option | NewOption>(flags, {
        [newOption]: newOptionValue,
      } as Record<Option | NewOption, number>);
    },
  };

  return optionSet;
}
