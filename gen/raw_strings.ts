import * as fc from "fast-check";

function line(start: string) {
  return fc.stringOf(
    fc.fullUnicode().map((s) => {
      // don't allow line feed
      if (s === "\n") return "";
      return s;
    }),
  ).map((s) => `${start}${s}\n`);
}

const indent = fc.stringOf(fc.constantFrom("\t", " "), { maxLength: 6 });

export function raw_block(type: string, start: string) {
  return fc.array(fc.tuple(line(start), indent), {
    minLength: 1,
  }).map((lines) => ({
    type,
    str: lines.map((p) => p.join("")).join(""),
    expanded: true,
  }));
}

export const raw_string = raw_block("raw_string", "|");

if (import.meta.main) {
  console.log("a sample of raw strings...");
  for (const s of fc.sample(raw_string, 20)) {
    console.log(s);
  }
}
