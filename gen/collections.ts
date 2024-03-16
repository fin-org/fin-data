import * as fc from "fast-check";
import { symbol } from "./symbols.ts";
import { number } from "./numbers.ts";
import { escaped_string } from "./escaped_strings.ts";
import { raw_string } from "./raw_strings.ts";
import { comment } from "./comments.ts";
import { boolean } from "./extensions.ts";
import { to_string } from "./render.ts";

const gap = fc.array(fc.constantFrom("\n", "\t", " ", ","), { maxLength: 4 })
  .map((arr) => ({ type: "gap", str: arr.join("") }));

const assoc = fc.tuple(gap, gap).map(
  ([g1, g2]) => ({ type: "assoc", str: `${g1.str}=${g2.str}` }),
);

const { map } = fc.letrec((arb) => ({
  // values
  value: fc.oneof(
    { arbitrary: symbol, weight: 1 },
    { arbitrary: number, weight: 1 },
    { arbitrary: escaped_string, weight: 1 },
    { arbitrary: raw_string, weight: 1 },
    { arbitrary: boolean, weight: 1 },
    { arbitrary: arb("array"), weight: 1 },
    { arbitrary: arb("map"), weight: 1 },
  ),

  // non-values
  non_value: fc.oneof(
    { arbitrary: comment, weight: 1 },
    { arbitrary: gap, weight: 3 },
  ),

  // arrays
  tag: fc.oneof(
    { arbitrary: symbol, weight: 1 },
    { arbitrary: fc.constant(null), weight: 3 },
  ),
  array_element: fc.oneof(
    { arbitrary: arb("value"), weight: 1 },
    { arbitrary: arb("non_value"), weight: 1 },
  ),
  array: fc.tuple(arb("tag"), fc.array(arb("array_element"))).map((
    [tag, elements],
  ) => ({
    type: "array",
    tag,
    elements,
    expanded: elements.some((e) => e.expanded),
  })),

  // maps
  map_entry: fc.tuple(arb("value"), assoc, arb("value")).map((
    [key, assoc, val],
  ) => ({
    type: "map_entry",
    key,
    assoc,
    val,
    expanded: Boolean(key.expanded || val.expanded),
  })),
  map_element: fc.oneof(
    { arbitrary: arb("map_entry"), weight: 1 },
    { arbitrary: arb("non_value"), weight: 1 },
  ),
  map: fc.tuple(arb("tag"), fc.array(arb("map_element"))).map((
    [tag, elements],
  ) => ({
    type: "map",
    tag,
    elements,
    expanded: elements.some((e) => e.expanded),
  })),
}));

const top_level = map.map((m) => ({ ...m, top: true }));

const input = top_level.map(to_string);

if (import.meta.main) {
  console.log("a sample of arrays...");
  for (const s of fc.sample(input, 20)) {
    console.log(s);
  }
}
