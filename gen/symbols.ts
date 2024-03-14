import * as fc from "fast-check";

export const symbol = fc.stringMatching(/^[a-z_:][a-z_:\d]*$/)
  .map((s) => (s.replace(/::+/g, ":").replace(/__+/g, "_")))
  .filter((s) => !s.endsWith(":"))
  .filter((s) => !/:\d/.test(s));

if (import.meta.main) {
  console.log("a sample of symbols...");
  for (const s of fc.sample(symbol, 20)) {
    console.log();
    console.log(s);
  }
}
