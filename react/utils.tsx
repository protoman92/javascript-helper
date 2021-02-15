import { ComponentEnhancer, shouldUpdate, shallowEqual } from "recompose";
import { compose, Dispatch } from "redux";
import { connect } from "react-redux";

export function getClassName(
  ...classNames: readonly (false | null | string | undefined)[]
) {
  let finalClassName = "";

  for (const className of classNames) {
    if (typeof className === "string") {
      finalClassName = finalClassName.concat(" ", className);
    }
  }

  return finalClassName.trim();
}

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
