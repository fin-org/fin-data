// deno-lint-ignore-file no-explicit-any
// TODO types. validate generated data. can zod generate types?

function requires_space(a: any, b: any) {
  if (a?.type === "symbol" && b?.type === "symbol") return true;
  if (a?.type === "symbol" && b?.type === "number") return true;
  if (a?.type === "number" && b?.type === "symbol") return true;
  if (a?.type === "number" && b?.type === "number") return true;
  return false;
}

function requires_newline(a: any, b: any) {
  if (a?.type === "raw_string" && b?.type === "raw_string") return true;
  if (a?.type === "comment" && b?.type === "comment") return true;
  return false;
}

function push(stack: any[], el: any) {
  stack.push(el);
  return stack;
}

export function to_string(data: any) {
  const stack = [data];
  const output = [];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.top) {
      node.elements.reduceRight(push, stack);
    } else if (node.type === "map") {
      stack.push({ str: ")" });
      node.elements.reduceRight(push, stack);
      stack.push({ str: "(" });
      if (node.tag) stack.push(node.tag);
    } else if (node.type === "map_entry") {
      stack.push(node.val);
      stack.push(node.eq);
      stack.push(node.key);
    } else if (node.type === "array") {
      stack.push({ str: "]" });
      node.elements.reduceRight(push, stack);
      stack.push({ str: "[" });
      if (node.tag) stack.push(node.tag);
    } else if (node.str !== undefined) {
      if (requires_space(node, output.at(-1))) {
        output.push({ type: "space", str: " " });
      }
      if (requires_newline(node, output.at(-1))) {
        output.push({ type: "newline", str: "\n" });
      }
      output.push(node);
    } else {
      throw node;
    }
  }
  return output.map((n) => n.str).join("");
}

const blocks = new Set(["comment", "raw_string"]);

export function to_formatted_nodes(data: any) {
  const stack = [data];
  const output = [];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.top) {
      node.elements.reduceRight((st: any[], el: any) => {
        st.push(el);
        el.parent = node;
        el.depth = 0;
        return st;
      }, stack);
    } else if (node.type === "gap") {
      // --- GAPS ---
      const { parent } = node;

      // ignore gaps for inline parents (they're added automatically)
      if (!parent.expanded) continue;

      if (parent.midline) {
        // midline. capture intent to continue or up to two line feeds
        if (parent.gap === ",") continue;
        if (node.str.includes(",")) {
          parent.gap = ",";
          continue;
        }
        const lfs = `${parent.gap ?? ""}${node.str}`.split("\n", 3).length - 1;
        parent.gap = lfs > 0 ? "\n".repeat(lfs) : undefined;
      } else {
        // newline. parent gap can only be a single line feed
        if (parent.gap === ",") throw new Error("bad gap state");
        if (parent.gap === "\n") continue;
        if (node.str.includes("\n")) parent.gap = "\n";
      }

      //
    } else if (node.type === "comment" || node.type === "raw_string") {
      // --- COMMENTS & RAW STRINGS ---
      const { parent } = node;

      // check parent is expanded
      if (!parent.expanded) throw new Error("parent not expanded");

      // render the correct gap
      if (parent.midline) {
        output.push({ str: parent.gap?.startsWith("\n") ? parent.gap : "\n" });
        parent.midline = false;
      } else if (parent.gap) {
        output.push({ str: parent.gap });
      }

      // render the comment with correct indentation
      const comment: string = node.str.split("\n")
        .filter((l: string) => l.includes(node.type === "comment" ? "#" : "|"))
        .map((l: string) => `${"\t".repeat(node.depth)}${l.trimStart()}`)
        .join("\n");
      node.str = comment + "\n";
      delete node.parent;
      output.push(node);

      // reset the gap
      parent.gap = undefined;

      // ---
    } else if (node.type === "map_entry") {
      // --- MAP ENTRIES ---

      // set parent and depth for key/val nodes.
      const { parent, key, val } = node;
      if (parent.type !== "map") throw new Error("bad parent type");
      val.parent = node;
      val.depth = node.depth;
      key.parent = node;
      key.depth = node.depth;

      if (parent.expanded) {
        const key_block = blocks.has(node.key.type);
        const val_block = blocks.has(node.val.type);
        //

        if (parent.midline) {
          if (!key_block && parent.gap === ",") {
            output.push({ str: ", " });
          } else {
            output.push({
              str: parent.gap?.startsWith("\n") ? parent.gap : "\n",
            });
            key.indent = true;
          }
        } else {
          if (parent.gap) output.push({ str: parent.gap });
          key.indent = true;
        }
        parent.midline = !val_block;
        parent.gap = undefined;

        // render key/val
        stack.push(val);
        node.eq.str = (key_block ? "\t".repeat(node.depth) : " ") +
          node.eq.str + (val_block ? "\n" : " ");
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
      node.type === "symbol" || node.type === "number" ||
      node.type === "escaped_string"
    ) {
      // --- SYMBOLS, NUMBERS & ESCAPED STRINGS ---

      delete node.parent;
      if (node.indent) {
        node.str = "\t".repeat(node.depth) + node.str;
      }
      output.push(node);

      //
    } else {
      throw node;
    }
  }

  // final newline
  if (!output.at(-1).str.endsWith("\n")) output.push({ str: "\n" });

  return output;
}

export function to_formatted_string(data: any) {
  return to_formatted_nodes(data).map((n) => n.str).join("");
}

// gap that has a comma always formats to ", "?

if (import.meta.main) {
  const data = {
    type: "map",
    tag: null,
    expanded: true,
    top: true,
    elements: [
      {
        type: "map_entry",
        key: { type: "symbol", str: "a" },
        eq: { type: "eq", str: "=" },
        val: { type: "symbol", str: "b" },
      },
      { type: "gap", str: " , " },
      {
        type: "map_entry",
        key: { type: "symbol", str: "c" },
        eq: { type: "eq", str: "=" },
        val: { type: "symbol", str: "d" },
      },
      { type: "gap", str: "\n, " },
      {
        type: "map_entry",
        key: { type: "symbol", str: "e" },
        eq: { type: "eq", str: "=" },
        val: { type: "symbol", str: "f" },
      },
    ],
  };

  console.log(data);
  console.log(to_formatted_nodes(data));
  console.log(to_formatted_string(data));
}
