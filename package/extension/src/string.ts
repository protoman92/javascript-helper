import { words } from "capitalize";

declare global {
  interface String {
    capitalize(): string;
  }
}

String.prototype.capitalize = function () {
  return words(this.toString());
};
