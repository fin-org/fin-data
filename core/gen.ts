import * as fc from "fast-check";

// SYMBOLS

export const symbol = fc.stringMatching(/^[a-z_:][a-z_:\d]*$/)
  .map((s) => (s.replace(/::+/g, ":").replace(/__+/g, "_")))
  .filter((s) => !s.endsWith(":"))
  .filter((s) => !/:\d/.test(s))
  .map((str) => ({ type: "symbol", str }));

// NUMBERS

const dig = fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9");
const dig1 = fc.constantFrom("1", "2", "3", "4", "5", "6", "7", "8", "9");

function nat(maxLength: number) {
  return fc.tuple(dig1, fc.array(dig, { maxLength }))
    .map(([d, ds]) => `${d}${ds.join("")}`);
}

function int(maxLength: number) {
  return fc.oneof(
    { arbitrary: fc.constant("0"), weight: 1 },
    { arbitrary: nat(maxLength), weight: 4 },
  );
}

const frac = fc.array(dig, { minLength: 1 }).map((ds) => `.${ds.join("")}`);

const exp = fc.tuple(fc.boolean(), int(5))
  .map(([n, e]) => `e${n ? "-" : ""}${e}`);

export const number = fc.tuple(
  fc.boolean(),
  int(20),
  fc.option(frac),
  fc.option(exp),
).map(
  ([n, i, f, e]) => ({
    type: "number",
    str: `${n ? "-" : ""}${i}${f ?? ""}${e ?? ""}`,
  }),
);

// ESCAPED STRINGS

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

// RAW STRINGS & COMMENTS

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

function raw_block(type: string, start: string) {
  return fc.array(fc.tuple(line(start), indent), {
    minLength: 1,
    maxLength: 3,
  }).map((lines) => ({
    type,
    str: lines.map((p) => p.join("")).join(""),
    expanded: true,
  }));
}

export const raw_string = raw_block("raw_string", "|");
export const comment = raw_block("comment", "#");

// EXTENSIONS

export const boolean = fc.boolean().map((b) => ({
  type: "symbol",
  str: `${b}`,
  ext: true,
}));

// SAMPLES

if (import.meta.main) {
  console.log("\nsymbols...");
  for (const s of fc.sample(symbol, 5)) console.log(s);
  console.log("\nnumbers...");
  for (const s of fc.sample(number, 5)) console.log(s);
  console.log("\nescaped strings...");
  for (const s of fc.sample(escaped_string, 5)) console.log(s);
  console.log("\nraw strings...");
  for (const s of fc.sample(raw_string, 5)) console.log(s);
  console.log("\ncomments...");
  for (const s of fc.sample(comment, 5)) console.log(s);
}
