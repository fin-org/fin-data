import * as fc from "fast-check";
import * as gen from "./gen.ts";
import { to_formatted_string } from "./format.ts";
// import { assert, assertEquals } from "std/assert/mod.ts";

const correct_ending = fc.property(gen.top_level, (top) => {
	const out = to_formatted_string(top);
	return out === "" || out.endsWith("\n");
});

Deno.test("correct ending", () => {
	fc.assert(correct_ending);
});

const empty_lines = fc.property(gen.top_level, (top) => {
	const out = to_formatted_string(top);
	return !out.includes("\n\n\n");
});

Deno.test("no consecutive empty lines", () => {
	fc.assert(empty_lines);
});
