import { Action } from "redux";
import { ReducerWithOptionalReturn } from ".";
import { Neverable } from "../../../interface";

type CompatibleArray<T> = T[] | readonly T[];

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

type DeleteAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = Readonly<{ type: `${ActionPrefix}_delete_${Extract<StateKey, string>}` }>;

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

export function createSettablePropertyHelper<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
>({
  actionPrefix,
  stateKey,
}: Readonly<{
  actionPrefix: ActionPrefix;
  stateKey: StateKey;
}>): SettablePropertyHelper<State, StateKey, ActionPrefix> {
  return ({
    actionCreators: {
      [`Array_push_${stateKey}`]: (
        value: State[StateKey] extends CompatibleArray<infer ArrayElement>
          ? ArrayElement
          : undefined
      ) => ({ value, type: `${actionPrefix}_array_push_${stateKey}` }),
      [`Array_replace_${stateKey}`]: (
        args: State[StateKey] extends CompatibleArray<infer ArrayElement>
          ? ArrayReplaceAction_Arguments<ArrayElement>
          : undefined
      ) => ({ ...args, type: `${actionPrefix}_array_replace_${stateKey}` }),
      [`Array_unshift_${stateKey}`]: (
        value: State[StateKey] extends CompatibleArray<infer ArrayElement>
          ? ArrayElement
          : undefined
      ) => ({ value, type: `${actionPrefix}_array_unshift_${stateKey}` }),
      [`Boolean_toggle_${stateKey}`]: {
        type: `${actionPrefix}_boolean_toggle_${stateKey}`,
      },
      [`Delete_${stateKey}`]: { type: `${actionPrefix}_delete_${stateKey}` },
      [`Set_${stateKey}`]: (value: State[StateKey]) => ({
        value,
        type: `${actionPrefix}_set_${stateKey}`,
      }),
    },
    reducer: (
      state: State,
      action:
        | ArrayPushAction<State, StateKey, ActionPrefix>
        | ArrayReplaceAction<State, StateKey, ActionPrefix>
        | ArrayUnshiftAction<State, StateKey, ActionPrefix>
        | DeleteAction<State, StateKey, ActionPrefix>
        | SetAction<State, StateKey, ActionPrefix>
    ) => {
      if (
        action.type === `${actionPrefix}_array_push_${stateKey}` &&
        "value" in action
      ) {
        const arrayStateValue = [
          ...(((state[stateKey] as unknown) as unknown[]) || []),
        ];

        arrayStateValue.push(action.value);
        return { ...state, [stateKey]: arrayStateValue };
      }

      if (
        action.type === `${actionPrefix}_array_replace_${stateKey}` &&
        "value" in action
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
        action.type === `${actionPrefix}_array_unshift_${stateKey}` &&
        "value" in action
      ) {
        const arrayStateValue = [
          ...(((state[stateKey] as unknown) as unknown[]) || []),
        ];

        arrayStateValue.unshift(action.value);
        return { ...state, [stateKey]: arrayStateValue };
      }

      if (action.type === `${actionPrefix}_boolean_toggle_${stateKey}`) {
        return { ...state, [stateKey]: !state[stateKey] };
      }

      if (
        action.type === `${actionPrefix}_set_${stateKey}` &&
        "value" in action
      ) {
        return { ...state, [stateKey]: action.value };
      }

      if (action.type === `${actionPrefix}_delete_${stateKey}`) {
        return { ...state, [stateKey]: undefined };
      }

      return undefined;
    },
  } as unknown) as SettablePropertyHelper<State, StateKey, ActionPrefix>;
}
