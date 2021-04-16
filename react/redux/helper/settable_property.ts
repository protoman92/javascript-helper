import { Action } from "redux";
import { ReducerWithOptionalReturn } from ".";
import { Neverable } from "../../../interface";

type CompatibleArray<T> = T[] | readonly T[];
type CompatibleObject<K extends string, V> = { [x in Extract<K, string>]: V };

type NoopAction<ActionPrefix extends string> = Readonly<{
  type: `${ActionPrefix}_noop`;
}>;

type ArrayPushAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<CompatibleArray<infer ArrayElement>>
  ? Readonly<{
      type: `${ActionPrefix}_array_push_${Extract<StateKey, string>}`;
      value: ArrayElement;
    }>
  : NoopAction<ActionPrefix>;

type ArrayReplaceAction_Arguments<ArrayElement> = Readonly<
  { value: ArrayElement } & (
    | { index: number }
    | { predicate: (currentValue: ArrayElement, index: number) => boolean }
    | { propertyToCheckEquality: keyof ArrayElement }
  )
>;

type ArrayReplaceAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<CompatibleArray<infer ArrayElement>>
  ? Readonly<
      {
        type: `${ActionPrefix}_array_replace_${Extract<StateKey, string>}`;
      } & ArrayReplaceAction_Arguments<ArrayElement>
    >
  : NoopAction<ActionPrefix>;

type ArrayUnshiftAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<CompatibleArray<infer ArrayElement>>
  ? Readonly<{
      type: `${ActionPrefix}_array_unshift_${Extract<StateKey, string>}`;
      value: ArrayElement;
    }>
  : NoopAction<ActionPrefix>;

type BooleanToggleAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<boolean>
  ? Readonly<{
      type: `${ActionPrefix}_boolean_toggle_${Extract<StateKey, string>}`;
    }>
  : NoopAction<ActionPrefix>;

type BooleanSetFalseAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<boolean>
  ? Readonly<{
      type: `${ActionPrefix}_boolean_set_true_${Extract<StateKey, string>}`;
    }>
  : NoopAction<ActionPrefix>;

type BooleanSetTrueAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<boolean>
  ? Readonly<{
      type: `${ActionPrefix}_boolean_set_false_${Extract<StateKey, string>}`;
    }>
  : NoopAction<ActionPrefix>;

type DeleteAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = Readonly<{ type: `${ActionPrefix}_delete_${Extract<StateKey, string>}` }>;

type ObjectDeletePropertyAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends CompatibleObject<infer K, unknown>
  ? Readonly<{
      key: K;
      type: `${ActionPrefix}_object_delete_property_${Extract<
        StateKey,
        string
      >}`;
    }>
  : NoopAction<ActionPrefix>;

type ObjectSetPropertyAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends CompatibleObject<infer K, infer V>
  ? Readonly<{
      key: K;
      type: `${ActionPrefix}_object_set_property_${Extract<StateKey, string>}`;
      value: V;
    }>
  : NoopAction<ActionPrefix>;

type SetAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = Readonly<{
  type: `${ActionPrefix}_set_${Extract<StateKey, string>}`;
  value: State[StateKey];
}>;

type SettablePropertyHelper<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = {
  actionCreators: Readonly<
    (State[StateKey] extends Neverable<boolean>
      ? {
          [x in `Boolean_set_false_${Extract<
            StateKey,
            string
          >}`]: BooleanSetFalseAction<State, StateKey, ActionPrefix>;
        } &
          {
            [x in `Boolean_set_true_${Extract<
              StateKey,
              string
            >}`]: BooleanSetTrueAction<State, StateKey, ActionPrefix>;
          } &
          {
            [x in `Boolean_toggle_${Extract<
              StateKey,
              string
            >}`]: BooleanToggleAction<State, StateKey, ActionPrefix>;
          }
      : {}) &
      (State[StateKey] extends Neverable<CompatibleArray<infer ArrayElement>>
        ? {
            [x in `Array_push_${Extract<StateKey, string>}`]: (
              value: ArrayElement
            ) => ArrayPushAction<State, StateKey, ActionPrefix>;
          } &
            {
              [x in `Array_replace_${Extract<StateKey, string>}`]: (
                args: ArrayReplaceAction_Arguments<ArrayElement>
              ) => ArrayReplaceAction<State, StateKey, ActionPrefix>;
            } &
            {
              [x in `Array_unshift_${Extract<StateKey, string>}`]: (
                value: ArrayElement
              ) => ArrayUnshiftAction<State, StateKey, ActionPrefix>;
            }
        : {}) &
      (State[StateKey] extends Neverable<infer O>
        ? O extends CompatibleObject<string, unknown>
          ? {
              [x in `Object_delete_property_${Extract<StateKey, string>}`]: <
                K extends keyof O
              >(
                key: K
              ) => ObjectDeletePropertyAction<State, StateKey, ActionPrefix>;
            } &
              {
                [x in `Object_set_property_${Extract<StateKey, string>}`]: <
                  K extends keyof O
                >(
                  key: K,
                  value: O[K]
                ) => ObjectSetPropertyAction<State, StateKey, ActionPrefix>;
              }
          : {}
        : {}) &
      {
        [x in `Delete_${Extract<StateKey, string>}`]: DeleteAction<
          State,
          StateKey,
          ActionPrefix
        >;
      } &
      {
        [x in `Set_${Extract<StateKey, string>}`]: (
          value: State[StateKey]
        ) => SetAction<State, StateKey, ActionPrefix>;
      }
  >;
  reducer: ReducerWithOptionalReturn<State, Action>;
};

type CreateSettablePropertyHelperArgs<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = Readonly<
  {
    actionPrefix: ActionPrefix;
    stateKey: StateKey;
  } & (State[StateKey] extends Neverable<CompatibleArray<unknown>>
    ? { propertyType: typeof TYPE_PROPERTY_ARRAY }
    : State[StateKey] extends Neverable<boolean>
    ? { propertyType: typeof TYPE_PROPERTY_BOOLEAN }
    : State[StateKey] extends Neverable<CompatibleObject<string, unknown>>
    ? { propertyType: typeof TYPE_PROPERTY_OBJECT }
    : { propertyType?: undefined })
>;

/** Use these property types to avoid adding unnecessary action creators */
const TYPE_PROPERTY_ARRAY = "ARRAY";
const TYPE_PROPERTY_BOOLEAN = "BOOLEAN";
const TYPE_PROPERTY_OBJECT = "OBJECT";

function isOfType<T extends { type: string }>(
  obj: Readonly<{ type: string }>,
  typeToCheck: string
): obj is Exclude<T, NoopAction<string>> {
  return obj["type"] === typeToCheck;
}

export function createSettablePropertyHelper<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
>({
  actionPrefix,
  propertyType,
  stateKey,
}: CreateSettablePropertyHelperArgs<
  State,
  StateKey,
  ActionPrefix
>): SettablePropertyHelper<State, StateKey, ActionPrefix> {
  return ({
    actionCreators: {
      ...(propertyType === TYPE_PROPERTY_ARRAY
        ? {
            [`Array_push_${stateKey}`]: (
              value: State[StateKey] extends CompatibleArray<infer ArrayElement>
                ? ArrayElement
                : undefined
            ) => ({ value, type: `${actionPrefix}_array_push_${stateKey}` }),
            [`Array_replace_${stateKey}`]: (
              args: State[StateKey] extends CompatibleArray<infer ArrayElement>
                ? ArrayReplaceAction_Arguments<ArrayElement>
                : undefined
            ) => ({
              ...args,
              type: `${actionPrefix}_array_replace_${stateKey}`,
            }),
            [`Array_unshift_${stateKey}`]: (
              value: State[StateKey] extends CompatibleArray<infer ArrayElement>
                ? ArrayElement
                : undefined
            ) => ({ value, type: `${actionPrefix}_array_unshift_${stateKey}` }),
          }
        : {}),
      ...(propertyType === TYPE_PROPERTY_BOOLEAN
        ? {
            [`Boolean_set_false_${stateKey}`]: {
              type: `${actionPrefix}_boolean_set_false_${stateKey}`,
            },
            [`Boolean_set_true_${stateKey}`]: {
              type: `${actionPrefix}_boolean_set_true_${stateKey}`,
            },
            [`Boolean_toggle_${stateKey}`]: {
              type: `${actionPrefix}_boolean_toggle_${stateKey}`,
            },
          }
        : {}),
      ...(propertyType === TYPE_PROPERTY_OBJECT
        ? {
            [`Object_delete_property_${stateKey}`]: (key: string) => ({
              key,
              type: `${actionPrefix}_object_delete_property_${stateKey}`,
            }),
            [`Object_set_property_${stateKey}`]: (
              key: string,
              value: unknown
            ) => ({
              key,
              value,
              type: `${actionPrefix}_object_set_property_${stateKey}`,
            }),
          }
        : {}),
      [`Delete_${stateKey}`]: { type: `${actionPrefix}_delete_${stateKey}` },
      [`Set_${stateKey}`]: (value: State[StateKey]) => ({
        value,
        type: `${actionPrefix}_set_${stateKey}`,
      }),
    },
    reducer: (state: State, action: Action) => {
      if (
        isOfType<ArrayPushAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_array_push_${stateKey}`
        )
      ) {
        const arrayStateValue = [
          ...(((state[stateKey] as unknown) as unknown[]) || []),
        ];

        arrayStateValue.push(action.value);
        return { ...state, [stateKey]: arrayStateValue };
      }

      if (
        isOfType<ArrayReplaceAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_array_replace_${stateKey}`
        )
      ) {
        const valueToReplace = action.value;

        const arrayStateValue = [
          ...(((state[stateKey] as unknown) as unknown[]) || []),
        ];

        let index = -1;
        let findIndexFunction: ((currentValue: any) => boolean) | undefined;

        if ("index" in action) {
          index = (action as any).index;
        } else if ("predicate" in action) {
          findIndexFunction = (action as any).predicate;
        } else if ("propertyToCheckEquality" in action) {
          const propertyKey = (action as any).propertyToCheckEquality;

          findIndexFunction = (currentValue) =>
            currentValue[propertyKey] === (valueToReplace as any)[propertyKey];
        }

        if (findIndexFunction != null) {
          index = arrayStateValue.findIndex(findIndexFunction);
        }

        if (index !== -1) arrayStateValue[index] = action.value;
        return { ...state, [stateKey]: arrayStateValue };
      }

      if (
        isOfType<ArrayUnshiftAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_array_unshift_${stateKey}`
        )
      ) {
        const arrayStateValue = [
          ...(((state[stateKey] as unknown) as unknown[]) || []),
        ];

        arrayStateValue.unshift(action.value);
        return { ...state, [stateKey]: arrayStateValue };
      }

      if (
        isOfType<BooleanSetTrueAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_boolean_set_true_${stateKey}`
        )
      ) {
        return { ...state, [stateKey]: true };
      }

      if (
        isOfType<BooleanSetFalseAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_boolean_set_false_${stateKey}`
        )
      ) {
        return { ...state, [stateKey]: false };
      }

      if (
        isOfType<BooleanToggleAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_boolean_toggle_${stateKey}`
        )
      ) {
        return { ...state, [stateKey]: !state[stateKey] };
      }

      if (
        isOfType<ObjectDeletePropertyAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_object_delete_property_${stateKey}`
        )
      ) {
        const objectStateValue = { ...(state[stateKey] || {}) } as any;
        delete objectStateValue[action.key];
        return { ...state, [stateKey]: objectStateValue };
      }

      if (
        isOfType<ObjectSetPropertyAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_object_set_property_${stateKey}`
        )
      ) {
        const objectStateValue = { ...(state[stateKey] || {}) } as any;
        objectStateValue[action.key] = action.value;
        return { ...state, [stateKey]: objectStateValue };
      }

      if (
        isOfType<SetAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_set_${stateKey}`
        )
      ) {
        return { ...state, [stateKey]: action.value };
      }

      if (
        isOfType<DeleteAction<State, StateKey, ActionPrefix>>(
          action,
          `${actionPrefix}_delete_${stateKey}`
        )
      ) {
        return { ...state, [stateKey]: undefined };
      }

      return undefined;
    },
  } as unknown) as SettablePropertyHelper<State, StateKey, ActionPrefix>;
}
