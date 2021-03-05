import { combineReducers, createSettablePropertyHelper } from ".";

describe("Redux helpers", () => {
  it("Settable property helper should work correctly", async () => {
    // Setup
    interface State {
      property: string;
    }

    let state: State | undefined = { property: "What" };

    const helper = createSettablePropertyHelper<State, "property", "PREFIX">({
      actionPrefix: "PREFIX",
      stateKey: "property",
    });

    // When && Then
    state = helper.reducer(state, helper.actionCreators.Set_property("NV"));
    expect(state?.property).toEqual("NV");
    state = helper.reducer(state!, helper.actionCreators.Delete_property);
    expect(state?.property).toBeUndefined();
    expect(helper.reducer(state!, {} as any)).toBeUndefined();
  });

  it("Combining reducers should work", () => {
    // Setup
    interface State {
      property: string;
    }

    const combined = combineReducers<State, { type: "T1" | "T2" }>(
      { property: "0" },
      () => undefined,
      (...[, action]) => (action.type === "T1" ? { property: "1" } : undefined)
    );

    // When && Then
    expect(combined(undefined, { type: "T1" })).toEqual({ property: "1" });
    expect(combined(undefined, { type: "T2" })).toEqual({ property: "0" });
  });
});
