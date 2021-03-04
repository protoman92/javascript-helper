import { Reducer } from "redux";

type DeletablePropertyAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = Readonly<{ type: `${ActionPrefix}_delete_${Extract<StateKey, string>}` }>;

type ReducerWithOptionalReturn<State, Action> = (
  s: State,
  a: Action
) => State | undefined;

type SettablePropertyAction<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
> = Readonly<{
  type: `${ActionPrefix}_set_${Extract<StateKey, string>}`;
  value: State[StateKey];
}>;

export function createSettablePropertyHelper<
  State,
  StateKey extends keyof State,
  ActionPrefix extends string
>({
  actionPrefix,
  stateKey,
}: Readonly<{ actionPrefix: ActionPrefix; stateKey: StateKey }>): Readonly<{
  actionCreators: [
    (
      value: State[StateKey]
    ) => SettablePropertyAction<State, StateKey, ActionPrefix>,
    DeletablePropertyAction<State, StateKey, ActionPrefix>
  ];
  reducer: ReducerWithOptionalReturn<
    State,
    | DeletablePropertyAction<State, StateKey, ActionPrefix>
    | SettablePropertyAction<State, StateKey, ActionPrefix>
  >;
}> {
  return {
    actionCreators: [
      (value) => ({
        value,
        type: `${actionPrefix}_set_${stateKey}` as SettablePropertyAction<
          State,
          StateKey,
          ActionPrefix
        >["type"],
      }),
      {
        type: `${actionPrefix}_delete_${stateKey}` as DeletablePropertyAction<
          State,
          StateKey,
          ActionPrefix
        >["type"],
      },
    ],
    reducer: (state, action) => {
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
  };
}

export function combineReducers<State, Action extends import("redux").Action>(
  initialState: State,
  ...reducers: ReducerWithOptionalReturn<State, Action>[]
): Reducer<State, Action> {
  return (state = initialState, action) => {
    let newState: State | undefined;

    for (const reducer of reducers) {
      newState = reducer(state, action);
      if (newState != null) return newState;
    }

    return state;
  };
}
