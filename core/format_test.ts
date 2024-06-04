import { assertEquals } from "@std/assert";
import { to_formatted_string } from "./format.ts";
import {
	arr,
	com,
	esc_str,
	esym,
	gap,
	kv,
	map,
	num,
	raw_str,
	sym,
	tarr,
	tmap,
	top,
} from "./ast.ts";

Deno.test({
	name: "gaps and comments",
	fn: () => {
		const data = top(
			gap(""),
			gap("\t\n"),
			gap("\n \t,"),
			com("#abc\n\t\t \t #熞def\n\t \t\t\t #鏜\n\t #🐬\n"),
			gap(",\n \n "),
			com("#$.쒃\n \t\t"),
			gap(""),
			gap(","),
		);
		const res = "\n#abc\n#熞def\n#鏜\n#🐬\n\n#$.쒃\n";
		assertEquals(to_formatted_string(data), res);
	},
});

Deno.test({
	name: "map entries",
	async fn(t) {
		await t.step({
			name: "same line",
			fn() {
				const data = top(
					kv(sym("a"), sym("b")),
					gap("  , "),
					kv(sym("c"), sym("d")),
					gap("\n\n , \n "),
					kv(sym("e"), sym("f"), " = \n"),
				);
				const res = "a = b, c = d, e = f\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "new lines",
			fn() {
				const data = top(
					kv(sym("a"), sym("b"), "\n=\t"),
					gap(" "),
					kv(sym("c"), sym("d")),
					gap(" \n\n\n "),
					kv(sym("e"), sym("f")),
				);
				const res = "a = b\nc = d\n\ne = f\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "block vals",
			fn() {
				const data = top(
					kv(sym("a"), sym("b")),
					gap(","),
					kv(sym("c"), raw_str("|d\n")),
					gap("\t, \n\n"),
					kv(sym("e"), raw_str("|f\n"), ",,=\t"),
				);
				const res = "a = b, c =\n|d\n\ne =\n|f\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "block keys",
			fn() {
				const data = top(
					kv(sym("a"), sym("b")),
					gap(" , "),
					kv(raw_str("|c\n"), sym("d"), " = \n"),
					gap("\t, \n\n,"),
					kv(raw_str("|e\n"), sym("f")),
				);
				const res = "a = b\n|c\n= d\n|e\n= f\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "block keys & vals",
			fn() {
				const data = top(
					gap(" ,\t"),
					kv(raw_str("|a\n"), raw_str("|b\n")),
					gap("\t,\n\t"),
					kv(raw_str("|c\n"), raw_str("|d\n"), ", = ,\n"),
					gap("\t, "),
					kv(sym("e"), raw_str("|f\n")),
				);
				const res = "|a\n=\n|b\n\n|c\n=\n|d\ne =\n|f\n";
				assertEquals(to_formatted_string(data), res);
			},
		});
	},
});

Deno.test({
	name: "inline maps",
	fn() {
		const data = top(
			gap(" , \n"),
			kv(sym("a"), map(), ",\t\t="),
			gap(" ,\n"),
			kv(sym("b"), tmap(sym("sym"), kv(num("1"), num("2")))),
			gap(" \n\t\n"),
			kv(
				sym("c"),
				map(
					kv(num("1"), num("2")),
					gap(" \t "),
					kv(num("3"), num("4")),
					gap(","),
					kv(num("5"), num("6"), ",,\n=\n\n"),
					gap("\n\t"),
					kv(num("7"), num("8")),
					gap("\n\n\n \t, "),
				),
			),
		);
		const res = "\na = (), b = sym(1 = 2)\n\nc = (1 = 2, 3 = 4, 5 = 6, 7 = 8)\n";
		assertEquals(to_formatted_string(data), res);
	},
});

Deno.test({
	name: "expanded maps",
	fn() {
		const data = top(
			kv(
				sym("a"),
				map(
					com("#\n\t"),
					kv(
						sym("b"),
						tmap(
							sym("tag"),
							com("#\n\t"),
							kv(num("1"), num("2"), " ="),
							kv(tmap(sym("_")), num("3")),
							gap("\n\n"),
						),
					),
				),
			),
		);
		const res = "a = (\n\t#\n\tb = tag(\n\t\t#\n\t\t1 = 2\n\t\t_() = 3\n\n\t)\n)\n";
		assertEquals(to_formatted_string(data), res);
	},
});

Deno.test({
	name: "inline arrays",
	fn() {
		const data = top(
			gap(" , \n"),
			kv(sym("a"), arr(), ",\t\t="),
			gap(" ,\n"),
			kv(sym("b"), tarr(sym("sym"), gap("\n, "), num("1"), gap("\n,  \t"))),
			gap(" \n\t\n"),
			kv(
				sym("c"),
				arr(
					num("1"),
					gap(" \t "),
					num("2"),
					gap(","),
					num("3"),
					gap("\n\t"),
					num("4"),
					gap("\n\n\n \t, "),
				),
			),
		);
		const res = "\na = [], b = sym[1]\n\nc = [1, 2, 3, 4]\n";
		assertEquals(to_formatted_string(data), res);
	},
});

Deno.test({
	name: "expanded arrays",
	fn() {
		const data = top(
			kv(
				sym("a"),
				arr(
					gap(" \n, \t"),
					num("98"),
					gap(", \n\t\n"),
					tarr(
						sym("b"),
						gap(",, "),
						com("#\n"),
						gap(" \t, "),
						sym("c"),
						gap(" , "),
					),
					gap("\n\n"),
				),
			),
		);
		const res = "a = [\n\n\t98, b[\n\t\t#\n\t\tc\n\t]\n\n]\n";
		assertEquals(to_formatted_string(data), res);
	},
});

Deno.test({
	name: "specific cases",
	async fn(t) {
		await t.step({
			name: "case 1",
			fn() {
				const data = top(
					kv(
						raw_str("|a\n"),
						map(
							gap(" "),
							kv(num("-7"), num("-0.8"), "\n ,,=,  , "),
							gap("\n\n"),
						),
						"\n\n=\n,",
					),
				);
				const res = "|a\n= (-7 = -0.8)\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "case 2",
			fn() {
				const data = top(
					kv(sym("a"), arr(com("#\n"), tarr(sym("b")), map(), num("98"))),
				);
				const res = "a = [\n\t#\n\tb[], (), 98\n]\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "case 3",
			fn: () => {
				const data = top(
					kv(
						sym("a"),
						tarr(sym("i"), esc_str("98"), gap("\n"), sym("z4"), com("#\n")),
					),
				);
				const res = "a = i[\n\t98\n\tz4\n\t#\n]\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "case 4",
			fn: () => {
				const data = top(
					gap("\n"),
					kv(
						tarr(
							esym("ext:m:_7"),
							esym("fin:_25_6"),
							esym("ext:c5"),
							tmap(
								esym("fin:_8"),
								gap(",,\t,"),
								gap(" \n "),
								kv(
									esym("ext:u"),
									tarr(
										esym("ext:i:t"),
										gap("\n \n,"),
										gap(",, "),
										gap(" ,\t,"),
										esym("fin:_:_:t55"),
									),
								),
							),
							gap(","),
							gap(""),
							tarr(esym("fin:_0_1"), esym("fin:_:_1_8:w")),
						),
						esym("ext:done"),
					),
				);
				const res =
					"\next:m:_7[fin:_25_6, ext:c5, fin:_8(ext:u = ext:i:t[fin:_:_:t55]), fin:_0_1[fin:_:_1_8:w]] = ext:done\n";
				assertEquals(to_formatted_string(data), res);
			},
		});

		await t.step({
			name: "case 5",
			fn: () => {
				const data = top(kv(sym("a"), map(com("#"), kv(arr(), arr()))));
				const res = "a = (\n\t#\n\t[] = []\n)\n";
				assertEquals(to_formatted_string(data), res);
			},
		});
	},
});
