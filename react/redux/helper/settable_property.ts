import { Action } from "redux";
import { ReducerWithOptionalReturn } from ".";

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
      [`Delete_${stateKey}`]: {
        type: `${actionPrefix}_delete_${stateKey}` as DeleteAction<
          State,
          StateKey,
          ActionPrefix
        >["type"],
      },
      [`Set_${stateKey}`]: (value: State[StateKey]) => ({
        value,
        type: `${actionPrefix}_set_${stateKey}` as SetAction<
          State,
          StateKey,
          ActionPrefix
        >["type"],
      }),
    },
    reducer: (
      state: State,
      action:
        | DeleteAction<State, StateKey, ActionPrefix>
        | SetAction<State, StateKey, ActionPrefix>
    ) => {
      if (
        action.type === `${actionPrefix}_set_${stateKey}` &&
        "value" in action
      ) {
        return { ...state, [stateKey]: action.value };
      } else if (action.type === `${actionPrefix}_delete_${stateKey}`) {
        return { ...state, [stateKey]: undefined };
      } else {
        return undefined;
      }
    },
  } as unknown) as SettablePropertyHelper<State, StateKey, ActionPrefix>;
}
