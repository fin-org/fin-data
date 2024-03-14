import * as fc from "fast-check";

const dig = fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9");
const dig1 = fc.constantFrom("1", "2", "3", "4", "5", "6", "7", "8", "9");

function nat(maxLength: number) {
  return fc.tuple(dig1, fc.array(dig, { maxLength })).map(([d, ds]) =>
    `${d}${ds.join("")}`
  );
}

function int(maxLength: number) {
  return fc.oneof(
    { arbitrary: fc.constant("0"), weight: 1 },
    { arbitrary: nat(maxLength), weight: 4 },
  );
}

const frac = fc.array(dig, { minLength: 1 }).map((ds) => `.${ds.join("")}`);

const exp = fc.tuple(fc.boolean(), int(5)).map(([n, e]) =>
  `e${n ? "-" : ""}${e}`
);

export const number = fc.tuple(
  fc.boolean(),
  int(20),
  fc.option(frac),
  fc.option(exp),
).map(
  ([n, i, f, e]) => `${n ? "-" : ""}${i}${f ?? ""}${e ?? ""}`,
);

if (import.meta.main) {
  console.log("a sample of numbers...");
  for (const s of fc.sample(number, 20)) {
    console.log();
    console.log(s);
  }
}
