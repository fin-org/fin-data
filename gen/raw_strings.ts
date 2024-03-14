import * as fc from "fast-check";

const line = fc.stringOf(
  fc.fullUnicode().map((s) => {
    // don't allow line feed
    if (s === "\n") return "";
    return s;
  }),
).map((s) => `|${s}\n`);

const indent = fc.stringOf(fc.constantFrom("\t", " "), { maxLength: 6 });

const raw_string = fc.array(fc.tuple(line, indent), {
  minLength: 1,
}).map((lines) => lines.map((p) => p.join("")).join(""));

if (import.meta.main) {
  console.log("a sample of raw strings...");
  for (const s of fc.sample(raw_string, 20)) {
    console.log("---");
    console.log();
    console.log(s);
  }
}
