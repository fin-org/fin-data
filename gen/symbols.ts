import * as fc from "fast-check";

// TODO
// for all non-canonical symbols calculate all warning/error data

const separator = fc.oneof(
  { arbitrary: fc.constant(":"), weight: 8 },
  { arbitrary: fc.constant("::"), weight: 2 },
  { arbitrary: fc.constant(":::"), weight: 1 },
);

const fragment = fc.stringMatching(/^[a-z_A-Z][a-z_A-Z\d]*$/);

export const correctable_symbol = fc.tuple(
  fc.boolean(),
  fc.array(fc.tuple(separator, fragment), { minLength: 1, maxLength: 4 }),
).map((
  [keep, parts],
) => parts.flat(1).slice(keep ? 0 : 1).join(""));

export const canonical_symbol = correctable_symbol.map((s) =>
  s.toLowerCase().replace(/::+/g, ":").replace(/__+/g, "_")
);

const bad_symbol_fragment = fc.tuple(
  fc.boolean(),
  fc.array(
    fc.tuple(
      separator,
      fc.oneof(fragment, fc.stringMatching(/^[a-z_A-Z\d]+$/)),
    ),
    { minLength: 1, maxLength: 4 },
  ).filter((parts) => parts.some(([_, f]) => /^\d/.test(f))),
).map(([b, parts]) => {
  const keep = /^\d/.test(parts[0][1]) || b;
  return parts.flat(1).slice(keep ? 0 : 1).join("");
});

const bad_symbol_with_sep = fc.oneof(
  { arbitrary: fc.tuple(fc.constant(false), separator, separator), weight: 1 },
  {
    arbitrary: fc.tuple(fc.constant(true), correctable_symbol, separator),
    weight: 5,
  },
  {
    arbitrary: fc.tuple(fc.boolean(), bad_symbol_fragment, separator),
    weight: 5,
  },
).map(([b, sym, sep]) => b ? `${sym}${sep}` : sym);

const replacements = fc.array(
  fc.tuple(
    fc.integer({ min: 1, max: 50 }),
    fc.unicode().filter((c) => !' \t\n,"|()[]#'.includes(c)),
  ),
  { maxLength: 2 },
);

function replaceAt(str: string, idx: number, rep: string) {
  if (idx > str.length - 1) return str;
  return str.substring(0, idx) + rep + str.substring(idx + 1);
}

export const incorrect_symbol = fc.tuple(bad_symbol_with_sep, replacements).map(
  ([sym, reps]) => {
    for (const [i, r] of reps) sym = replaceAt(sym, i, r);
    return sym;
  },
);

if (import.meta.main) {
  console.log("canonical symbols...");
  console.log(fc.sample(canonical_symbol, 10));
  console.log("correctable symbols...");
  console.log(fc.sample(correctable_symbol, 10));
  console.log("incorrect symbols...");
  console.log(fc.sample(incorrect_symbol, 10));
}
