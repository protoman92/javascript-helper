import { connect } from "react-redux";
import {
  ComponentEnhancer,
  compose,
  shallowEqual,
  shouldUpdate,
} from "recompose";
import { Dispatch } from "redux";
export * from "./read_file";

/**
 * Connect store props with a mapper function. The target component must have
 * a store property and an optional dispatch property.
 */
export const connectStoreProps = (function () {
  return function <
    GlobalState,
    IP extends { dispatch?: Dispatch; store?: any },
    OP extends Omit<IP, "dispatch" | "store"> = Omit<IP, "dispatch" | "store">
  >(
    mapStateToProps: (
      storeState: GlobalState,
      props: IP
    ) => Pick<IP, "store"> & Partial<Omit<IP, "store">>
  ): ComponentEnhancer<IP, OP> {
    return compose(
      connect(mapStateToProps),
      shouldUpdate<IP>(
        (
          { dispatch: _d1, store: currentStore, ...currentProps },
          { dispatch: _d2, store: nextStore, ...nextProps }
        ) => {
          if (!shallowEqual(currentProps, nextProps)) return true;
          if (!shallowEqual(currentStore, nextStore)) return true;
          return false;
        }
      )
    );
  };
})();
