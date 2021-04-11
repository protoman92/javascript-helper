import { Action } from "redux";
import { ReducerWithOptionalReturn } from ".";
import { Neverable } from "../../../interface";

type NoopAction<ActionPrefix extends string> = Readonly<{
  type: `${ActionPrefix}_Noop`;
}>;

type ArrayPushAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<Array<infer ArrayElement>>
  ? Readonly<{
      type: `${ActionPrefix}_array_push_${Extract<StateKey, string>}`;
      value: ArrayElement;
    }>
  : NoopAction<ActionPrefix>;

type ArrayUnshiftAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = State[StateKey] extends Neverable<Array<infer ArrayElement>>
  ? Readonly<{
      type: `${ActionPrefix}_array_unshift_${Extract<StateKey, string>}`;
      value: ArrayElement;
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
    (State[StateKey] extends Neverable<Array<infer ArrayElement>>
      ? {
          [x in `Array_push_${Extract<StateKey, string>}`]: (
            value: ArrayElement
          ) => ArrayPushAction<State, StateKey, ActionPrefix>;
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
        value: State[StateKey] extends Array<infer ArrayElement>
          ? ArrayElement
          : undefined
      ) => ({ value, type: `${actionPrefix}_array_push_${stateKey}` }),
      [`Array_unshift_${stateKey}`]: (
        value: State[StateKey] extends Array<infer ArrayElement>
          ? ArrayElement
          : undefined
      ) => ({ value, type: `${actionPrefix}_array_unshift_${stateKey}` }),
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
        action.type === `${actionPrefix}_array_unshift_${stateKey}` &&
        "value" in action
      ) {
        const arrayStateValue = [
          ...(((state[stateKey] as unknown) as unknown[]) || []),
        ];

        arrayStateValue.unshift(action.value);
        return { ...state, [stateKey]: arrayStateValue };
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
