// @ts-ignore
import ObjectEntries from "object.entries";

export default function () {
  if (Object.entries == null) ObjectEntries.shim();
}
