import * as ast from "./ast.ts";

function requires_space(a?: ast.Output, b?: ast.Output) {
	if (a === undefined || b === undefined) return false;
	if (a.type === "symbol" && b.type === "symbol") return true;
	if (a.type === "symbol" && b.type === "number") return true;
	if (a.type === "number" && b.type === "symbol") return true;
	if (a.type === "number" && b.type === "number") return true;
	return false;
}

function requires_newline(a?: ast.Output, b?: ast.Output) {
	if (a === undefined || b === undefined) return false;
	if (a.type === "raw_string" && b.type === "raw_string") return true;
	if (a.type === "comment" && b.type === "comment") return true;
	return false;
}

function push(stack: ast.Node[], el: ast.Node) {
	stack.push(el);
	return stack;
}

export function to_string(node: ast.Node) {
	const stack: ast.Node[] = [node];
	const output: ast.Output[] = [];
	while (stack.length > 0) {
		const node = stack.pop();
		if (node === undefined) break;

		if (node.type === "top_level") {
			node.elements.reduceRight(push, stack);
		} else if (node.type === "map") {
			stack.push({ type: "close", str: ")" });
			node.elements.reduceRight(push, stack);
			stack.push({ type: "open", str: "(" });
			if (node.tag) stack.push(node.tag);
		} else if (node.type === "map_entry") {
			stack.push(node.val);
			stack.push(node.eq);
			stack.push(node.key);
		} else if (node.type === "array") {
			stack.push({ type: "close", str: "]" });
			node.elements.reduceRight(push, stack);
			stack.push({ type: "open", str: "[" });
			if (node.tag) stack.push(node.tag);
		} else if (node.str !== undefined) {
			if (requires_space(node, output.at(-1))) {
				output.push({ type: "gap", str: " " });
			}
			if (requires_newline(node, output.at(-1))) {
				output.push({ type: "gap", str: "\n" });
			}
			output.push(node);
		} else {
			throw node;
		}
	}
	return output.map((n) => n.str).join("");
}

const blocks = new Set(["comment", "raw_string"]);

export function to_formatted_nodes(data: ast.Node) {
	const stack: ast.Node[] = [data];
	const output: ast.Output[] = [];
	while (stack.length > 0) {
		const node = stack.pop();
		if (node === undefined) break;
		// console.log("rendering", node.type);
		if (node.type === "top_level") {
			node.elements.reduceRight((st, el) => {
				st.push(el);
				el.parent = node;
				el.depth = 0;
				return st;
			}, stack);
		} else if (node.type === "gap") {
			// --- GAPS ---
			const { parent } = node;
			if (!parent) throw node;

			// gaps are correct if inline
			if (!parent.expanded) {
				output.push(node);
				continue;
			}

			if (parent.midline) {
				// midline. capture intent to continue or up to two line feeds
				if (parent.gap === ", ") continue;
				if (node.str.includes(",")) {
					parent.gap = ", ";
					continue;
				}
				const lfs = `${parent.gap ?? ""}${node.str}`.split("\n", 3).length - 1;
				parent.gap = (lfs > 0 ? "\n".repeat(lfs) : undefined) as ast.Gaps;
			} else {
				// newline. parent gap can only be a single line feed
				if (parent.gap === ", ") throw new Error("bad gap state");
				if (parent.gap === "\n") continue;
				if (node.str.includes("\n")) parent.gap = "\n";
			}

			//
		} else if (node.type === "comment" || node.type === "raw_string") {
			// --- COMMENTS & RAW STRINGS ---
			const { parent } = node;

			// assertions
			if (!parent) throw new Error("no parent");
			if (!parent.expanded) throw new Error("parent not expanded");
			if (node.depth === undefined) throw new Error("depth not set");

			// render the correct gap
			if (parent.midline) {
				output.push({
					type: "gap",
					str: parent.gap?.startsWith("\n") ? parent.gap : "\n",
				});
				parent.midline = false;
			} else if (parent.gap) {
				output.push({ type: "gap", str: parent.gap });
			}

			// render the comment with correct indentation
			const comment: string = node.str
				.split("\n")
				.filter((l: string) => l.includes(node.type === "comment" ? "#" : "|"))
				.map((l: string) => `${"\t".repeat(node.depth ?? 0)}${l.trimStart()}`)
				.join("\n");
			node.str = comment + "\n";
			delete node.parent;
			output.push(node);

			// reset the gap
			parent.gap = undefined;

			// ---
		} else if (node.type === "map_entry") {
			// --- MAP ENTRIES ---
			const { parent, key, val } = node;

			// assertions
			if (!parent) throw new Error("no parent");

			// set parent and depth for key/val nodes.
			if (parent.type !== "map" && parent.type !== "top_level") {
				throw new Error("bad parent type");
			}
			val.parent = node;
			val.depth = node.depth;
			key.parent = node;
			key.depth = node.depth;

			if (parent.expanded) {
				const key_block = blocks.has(node.key.type);
				const val_block = blocks.has(node.val.type);

				if (parent.midline) {
					if (!key_block && parent.gap === ", ") {
						output.push({ type: "gap", str: parent.gap });
					} else {
						output.push({
							type: "gap",
							str: parent.gap?.startsWith("\n") ? parent.gap : "\n",
						});
						key.indent = true;
					}
				} else {
					if (parent.gap) output.push({ type: "gap", str: parent.gap });
					key.indent = true;
				}
				parent.midline = !val_block;
				parent.gap = undefined;

				// render key/val
				stack.push(val);
				node.eq.str = (key_block ? "\t".repeat(node.depth ?? 0) : " ") +
					"=" +
					(val_block ? "\n" : " ");
				stack.push(node.eq);
				stack.push(key);
			} else {
				stack.push(val);
				node.eq.str = " = ";
				stack.push(node.eq);
				stack.push(key);
			}

			//
		} else if (node.type === "eq") {
			output.push(node);
		} else if (
			node.type === "symbol" ||
			node.type === "number" ||
			node.type === "escaped_string"
		) {
			// --- SYMBOLS, NUMBERS & ESCAPED STRINGS ---
			const { parent } = node;

			// assertions
			if (!parent) throw new Error("no parent");

			// if an array element render gap
			if (
				parent.type === "array" &&
				parent.expanded &&
				!(node.type === "symbol" && node.tag)
			) {
				if (parent.gap !== undefined) {
					output.push({ type: "gap", str: parent.gap });
					parent.midline = !parent.gap.includes("\n");
					parent.gap = undefined;
				} else if (parent.midline) {
					output.push({ type: "gap", str: ", " });
				}
				if (!parent.midline) {
					node.str = "\t".repeat(node.depth ?? 0) + node.str;
				}
				parent.midline = true;
			} else if (node.indent) {
				node.str = "\t".repeat(node.depth ?? 0) + node.str;
			}

			delete node.parent;
			output.push(node);

			//
		} else if (node.type === "map" || node.type === "array") {
			// --- MAPS && ARRAYS ---
			const { parent } = node;

			// assertions
			if (!parent) throw new Error("no parent");

			// if an expanded array element render gap
			if (parent.type === "array" && parent.expanded) {
				if (parent.gap !== undefined) {
					output.push({ type: "gap", str: parent.gap });
					parent.midline = !parent.gap.includes("\n");
					parent.gap = undefined;
				} else if (parent.midline) {
					output.push({ type: "gap", str: ", " });
				}
				if (!parent.midline) node.indent = true;
				parent.midline = true;
			}

			if (!node.expanded) {
				// remove gaps. no idea how to make typescript happy here
				node.elements = node.elements.filter((el) => el.type !== "gap") as
					| ast.ArrayElement[]
					| ast.MapElement[];
			}

			stack.push({
				type: "close",
				str: node.type === "map" ? ")" : "]",
				parent: node,
			});
			node.elements.reduceRight((st, el, i) => {
				st.push(el);
				el.parent = node;
				el.depth = (node.depth ?? 0) + 1;
				if (i > 0 && !node.expanded) {
					st.push({ type: "gap", str: ", ", parent: node });
				}
				return st;
			}, stack);
			stack.push({
				type: "open",
				str: node.type === "map" ? "(" : "[",
				parent: node,
			});
			if (node.tag) {
				node.tag.indent = node.indent;
				node.tag.depth = node.depth;
				node.tag.parent = node;
				node.tag.tag = true;
				stack.push(node.tag);
			}

			//
		} else if (node.type === "open") {
			const { parent } = node;

			// assertions
			if (parent === undefined) throw new Error("no parent");
			if (parent.type === "top_level" || parent.type === "map_entry") {
				throw new Error("bad parent");
			}

			if (parent.tag === undefined && parent.indent) {
				node.str = "\t".repeat(parent.depth ?? 0) + node.str;
			}
			if (parent.expanded) node.str += "\n";
			output.push(node);
		} else if (node.type === "close") {
			const { parent } = node;
			// assertions
			if (parent === undefined) throw new Error("no parent");
			if (parent.type === "top_level") throw new Error("bad parent");

			if (parent.expanded) {
				if (parent.gap?.startsWith("\n")) {
					output.push({ type: "gap", str: parent.gap });
					parent.midline = undefined;
				}
				node.str = "\t".repeat(parent.depth ?? 0) + node.str;
				if (parent.midline) node.str = "\n" + node.str;
			}
			output.push(node);
		} else {
			throw node;
		}
	}

	// final newline
	if (output.length > 0 && !output.at(-1)?.str.endsWith("\n")) {
		output.push({ type: "gap", str: "\n" });
	}

	return output;
}

export function to_formatted_string(data: ast.Node) {
	return to_formatted_nodes(data)
		.map((n) => n.str)
		.join("");
}

if (import.meta.main) {
	console.log("generating formatted fin data...\n");
	const fc = await import("fast-check");
	const gen = await import("./gen.ts");
	const [top] = fc.sample(gen.top_level, 1);
	// console.log(JSON.stringify(top, null, 2));
	console.log(to_formatted_string(top));
}
