import * as fc from "fast-check";
import { symbol } from "./symbols.ts";

const extension = fc.oneof(
  // booleans
  fc.boolean().map((b) => `${b}`),
  // fin: symbols
  symbol.map((s) => `fin:${s}`.replace(/::+/g, ":")),
  // ext: symbols
  symbol.map((s) => `ext:${s}`.replace(/::+/g, ":")),
  // TODO... improve
);

if (import.meta.main) {
  console.log("a sample of extensions...");
  for (const s of fc.sample(extension, 20)) {
    console.log();
    console.log(s);
  }
}
