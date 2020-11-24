import React, { PureComponent } from "react";
import "./style.css";

interface Props {
  readonly className?: string;
  readonly spacing?: "small" | "large";
}

/** Wrap children with flex-wrap and make sure their spacings are consistent. */
export default class WrapBox extends PureComponent<Props> {
  render = () => {
    const { children, className = "", spacing = "small" } = this.props;

    return (
      <div
        className={`
        wrap-box-container
        wrap-box-container_${spacing}
        ${className}
        `}
      >
        {children}
      </div>
    );
  };
}
