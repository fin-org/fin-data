import * as fc from "fast-check";

const unicode_char = fc.fullUnicode().map((s) => {
  // don't allow \ or "
  if (s === "\\") return "";
  if (s === '"') return "";
  return s;
});

const common_esc = fc.constantFrom("\\\\", '\\"', "\\t", "\\r", "\\n");

const unicode_esc = fc.fullUnicode().map((s) => {
  const cp = s.codePointAt(0) ?? 0;
  return `\\u{${cp.toString(16)}}`;
});

export const escaped_string = fc.stringOf(fc.oneof(
  { arbitrary: unicode_char, weight: 10 },
  { arbitrary: common_esc, weight: 2 },
  { arbitrary: unicode_esc, weight: 1 },
)).map((inner) => ({
  type: "escaped_string",
  str: `\"${inner}\"`,
}));

if (import.meta.main) {
  console.log("a sample of escaped strings...");
  for (const s of fc.sample(escaped_string, 20)) {
    console.log(s);
  }
}
