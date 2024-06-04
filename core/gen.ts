import * as fc from "fast-check";
import * as ast from "./ast.ts";

// SYMBOLS

const symbol_str = fc
	.stringMatching(/^[a-z_:][a-z_:\d]*$/)
	.map((s) => s.replace(/::+/g, ":").replace(/__+/g, "_"))
	.filter((s) => !s.endsWith(":"))
	.filter((s) => !/:\d/.test(s));

export const symbol: fc.Arbitrary<ast.Symbol> = symbol_str
	.filter((s) => {
		if (s.startsWith("fin:")) return false;
		if (s.startsWith("ext:")) return false;
		if (s === "true" || s === "false") return false;
		return true;
	})
	.map((str) => ({ type: "symbol", str }));

function ext_symbol(
	prefix?: "fin:" | "ext:",
): fc.Arbitrary<ast.ExtendedSymbol> {
	const pre = prefix ? fc.constant(prefix) : fc.constantFrom("fin:", "ext:");
	return fc
		.tuple(pre, symbol_str)
		.filter(([_, s]) => !s.endsWith("_"))
		.map(([p, s]) => ({
			type: "symbol",
			str: `${p}${s.startsWith(":") ? s.slice(1) : s}`,
			ext: true,
		}));
}

function dis_symbol(
	prefix?: "fin:" | "ext:",
): fc.Arbitrary<ast.DiscardedSymbol> {
	return ext_symbol(prefix).map(({ str }) => ({
		type: "symbol",
		str: str + "_",
		ext: true,
		discarded: true,
	}));
}

// NUMBERS

const dig = fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9");
const dig1 = fc.constantFrom("1", "2", "3", "4", "5", "6", "7", "8", "9");

function nat(maxLength: number) {
	return fc
		.tuple(dig1, fc.array(dig, { maxLength }))
		.map(([d, ds]) => `${d}${ds.join("")}`);
}

function int(maxLength: number) {
	return fc.oneof(
		{ arbitrary: fc.constant("0"), weight: 1 },
		{ arbitrary: nat(maxLength), weight: 4 },
	);
}

const frac = fc.array(dig, { minLength: 1 }).map((ds) => `.${ds.join("")}`);

const exp = fc
	.tuple(fc.boolean(), int(5))
	.map(([n, e]) => `e${n ? "-" : ""}${e}`);

export const number: fc.Arbitrary<ast.Number> = fc
	.tuple(fc.boolean(), int(20), fc.option(frac), fc.option(exp))
	.map(([n, i, f, e]) => ({
		type: "number",
		str: `${n ? "-" : ""}${i}${f ?? ""}${e ?? ""}`,
	}));

// ESCAPED STRINGS

const unicode_char = fc.oneof(fc.ascii(), fc.fullUnicode()).map((s) => {
	// common escapes
	if (s === "\\") return "\\\\";
	if (s === '"') return '\\"';
	if (s === "\n") return "\\\n";
	if (s === "\r") return "\\\r";
	if (s === "\t") return "\\\t";
	// escape everything <= U+001F
	const cp = s.charCodeAt(0);
	if (cp <= 0x1f) return `\\u{${cp.toString(16)}}`;
	return s; // everything else is unescaped.
});

// full unicode escape sequences are always allowed
const unicode_esc_seq = fc.fullUnicode().map((s) => {
	const cp = s.codePointAt(0) ?? 0;
	return `\\u{${cp.toString(16)}}`;
});

export const escaped_string: fc.Arbitrary<ast.EscapedString> = fc
	.stringOf(
		fc.oneof(
			{ arbitrary: unicode_char, weight: 10 },
			{ arbitrary: unicode_esc_seq, weight: 1 },
		),
	)
	.map((inner) => ({
		type: "escaped_string",
		str: `\"${inner}\"`,
	}));

// RAW STRINGS & COMMENTS

function line(start: string) {
	return fc
		.stringOf(
			fc.oneof(fc.ascii(), fc.fullUnicode()).map((s) => (s === "\n" ? "" : s)),
		)
		.map((s) => `${start}${s}\n`);
}

const indent = fc.stringOf(fc.constantFrom("\t", " "), { maxLength: 4 });

function raw_block(start: string) {
	return fc
		.array(fc.tuple(line(start), indent), {
			minLength: 1,
			maxLength: 3,
		})
		.map((lines) => ({
			str: lines.map((p) => p.join("")).join(""),
			expanded: true,
		}));
}

export const raw_string: fc.Arbitrary<ast.RawString> = raw_block("|").map(
	(b) => ({ ...b, type: "raw_string" }),
);

export const comment: fc.Arbitrary<ast.Comment> = raw_block("#").map((b) => ({
	...b,
	type: "comment",
}));

// BUILTINS

export const boolean: fc.Arbitrary<ast.ExtendedSymbol> = fc
	.boolean()
	.map((b) => ({
		type: "symbol",
		str: `${b}`,
		ext: true,
	}));

export const timestamp: fc.Arbitrary<ast.ExtendedArray> = fc
	.date({
		min: new Date("0001-01-01T00:00:00Z"),
		max: new Date("9999-12-31T23:59:59Z"),
	})
	.map((d) => {
		const parent: ast.ExtendedArray = {
			type: "array",
			tag: { type: "symbol", ext: true, str: "fin:timestamp" },
			expanded: false,
			elements: [],
		};
		parent.elements.push({
			type: "escaped_string",
			str: `"${d.toISOString()}"`,
			parent,
		});
		return parent;
	});

// GAPS

const gap: fc.Arbitrary<ast.Gap> = fc
	.array(fc.constantFrom("\n", "\t", " ", ",", ","), { maxLength: 4 })
	.map((arr) => ({ type: "gap", str: arr.join("") }));

// EQ

const eq: fc.Arbitrary<ast.Eq> = fc
	.tuple(gap, gap)
	.map(([g1, g2]) => ({ type: "eq", str: `${g1.str}=${g2.str}` }));

const tag = fc.oneof(
	{ arbitrary: symbol, weight: 1 },
	{ arbitrary: fc.constant(undefined), weight: 3 },
);

// DATA

export const { array, map } = fc.letrec((sub) => {
	const sub_array = sub("array") as fc.Arbitrary<ast.Array>;
	const sub_map = sub("map") as fc.Arbitrary<ast.Map>;

	const ext_coll: fc.Arbitrary<ast.ExtendedArray | ast.ExtendedMap> = fc
		.tuple(ext_symbol(), fc.oneof(sub_array, sub_map))
		.map(([tag, arr]) => ({ ...arr, tag }));

	const value: fc.Arbitrary<ast.Value> = fc.oneof(
		{ arbitrary: symbol, weight: 1 },
		{ arbitrary: number, weight: 1 },
		{ arbitrary: escaped_string, weight: 1 },
		{ arbitrary: raw_string, weight: 1 },
		{ arbitrary: sub_array, weight: 1 },
		{ arbitrary: sub_map, weight: 1 },
		// extensions
		{ arbitrary: ext_symbol(), weight: 1 },
		{ arbitrary: ext_coll, weight: 1 },
		// builtins
		{ arbitrary: boolean, weight: 1 },
		{ arbitrary: timestamp, weight: 1 },
	);

	const non_value: fc.Arbitrary<ast.NonValue> = fc.oneof(
		{ arbitrary: comment, weight: 1 },
		{ arbitrary: gap, weight: 3 },
		// TODO impl. formatting discards
		// { arbitrary: dis_symbol(), weight: 1 },
		// { arbitrary: dis_coll, weight: 1 },
	);

	const array_elements: fc.Arbitrary<ast.ArrayElement[]> = fc.array(
		fc.oneof(
			{ arbitrary: value, weight: 1 },
			{ arbitrary: non_value, weight: 1 },
		),
	);

	const array: fc.Arbitrary<ast.Array> = fc
		.tuple(tag, array_elements)
		.map(([tag, elements]) => ({
			type: "array",
			tag,
			elements,
			expanded: elements.some((e) => e.expanded),
		}));

	const map_entry: fc.Arbitrary<ast.MapEntry> = fc
		.tuple(value, eq, value)
		.map(([key, eq, val]) => ({
			type: "map_entry",
			key,
			eq,
			val,
			expanded: Boolean(key.expanded || val.expanded),
		}));

	const map_elements: fc.Arbitrary<ast.MapElement[]> = fc
		.array(
			fc.oneof(
				{ arbitrary: map_entry, weight: 1 },
				{ arbitrary: non_value, weight: 1 },
			),
		)
		.filter((elements) => {
			const consecutive_raw_string = elements.some((el, i, arr) => {
				if (i === 0) return false;
				if (el.type !== "map_entry") return false;
				const prev = arr[i - 1];
				if (prev.type !== "map_entry") return false;
				return prev.val.type === "raw_string" && el.key.type === "raw_string";
			});
			return !consecutive_raw_string;
		});

	const map: fc.Arbitrary<ast.Map> = fc
		.tuple(tag, map_elements)
		.map(([tag, elements]) => ({
			type: "map",
			tag,
			elements,
			expanded: elements.some((e) => e.expanded),
		}));

	return { array, map };
});

export const top_level: fc.Arbitrary<ast.TopLevel> = map.map((m) => ({
	type: "top_level",
	expanded: true,
	elements: m.elements,
}));

// SAMPLES

if (import.meta.main) {
	console.log("\nsymbols...");
	for (const s of fc.sample(symbol, 5)) console.log(s);
	console.log("\nextended symbols...");
	for (const s of fc.sample(ext_symbol(), 5)) console.log(s);
	console.log("\ndiscarded symbols...");
	for (const s of fc.sample(dis_symbol(), 5)) console.log(s);
	console.log("\nnumbers...");
	for (const s of fc.sample(number, 5)) console.log(s);
	console.log("\nescaped strings...");
	for (const s of fc.sample(escaped_string, 5)) console.log(s);
	console.log("\nraw strings...");
	for (const s of fc.sample(raw_string, 5)) console.log(s);
	console.log("\ncomments...");
	for (const s of fc.sample(comment, 5)) console.log(s);
}
