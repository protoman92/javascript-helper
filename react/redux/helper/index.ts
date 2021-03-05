import { Reducer } from "redux";
export * from "./settable_property";

export type ReducerWithOptionalReturn<State, Action> = (
  s: State,
  a: Action
) => State | undefined;

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
