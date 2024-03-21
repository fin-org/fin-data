import * as fc from "fast-check";

export const boolean = fc.oneof(
  fc.boolean().map((b) => ({ type: "symbol", str: `${b}` })),
);

// TODO more extensions. incl non-values

if (import.meta.main) {
  console.log("a sample of extensions...");
  for (const s of fc.sample(boolean, 20)) {
    console.log(s);
  }
}
