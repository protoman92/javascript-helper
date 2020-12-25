type BaseFlags = Record<string, boolean>;

interface BaseArgs<Flags extends BaseFlags> {
  readonly allFlags: Flags;
  readonly flagToSetTrue: keyof Flags;
}

interface WithMapperArgs<
  Flags extends BaseFlags,
  Mappers extends { [x in keyof Flags]: (flag: boolean) => any }
> extends BaseArgs<Flags> {
  readonly mappers: Mappers;
}

interface FlipMutualExclusiveFlags {
  <Flags extends BaseFlags>(args: BaseArgs<Flags>): Readonly<
    { [x in keyof Flags]: boolean }
  >;
  <
    Flags extends BaseFlags,
    Mappers extends { [x in keyof Flags]: (flag: boolean) => any }
  >(
    args: WithMapperArgs<Flags, Mappers>
  ): Readonly<{ [x in keyof Flags]: ReturnType<Mappers[x]> }>;
  <
    Mappers extends Record<string, (flag: boolean) => any>,
    Flags extends { [x in keyof Mappers]: boolean }
  >(
    args: Readonly<{ mappers: Mappers }>
  ): (
    args: BaseArgs<Flags>
  ) => Readonly<{ [x in keyof Mappers]: ReturnType<Mappers[x]> }>;
}

/** Given a set of flags, make sure that at any one time, only one is true */
export default (function () {
  const _ = function <
    Flags extends BaseFlags,
    Mappers extends { [x in keyof Flags]: (flag: boolean) => any }
  >({ allFlags, flagToSetTrue, mappers }: WithMapperArgs<Flags, Mappers>) {
    const result: Record<string, any> = {};

    for (const key in allFlags) {
      let value: any;

      if (key === flagToSetTrue) {
        value = true;
      } else {
        value = false;
      }

      if (mappers != null) value = mappers[key](value);
      result[key] = value;
    }

    return result;
  } as FlipMutualExclusiveFlags;

  return function <
    Flags extends BaseFlags,
    Mappers extends { [x in keyof Flags]: (flag: boolean) => any }
  >(args: WithMapperArgs<Flags, Mappers>) {
    if (args.mappers != null && args.allFlags == null) {
      return function (args1: BaseArgs<Flags>) {
        return _({ ...args1, mappers: args.mappers });
      };
    } else {
      return _(args);
    }
  };
})() as FlipMutualExclusiveFlags;
