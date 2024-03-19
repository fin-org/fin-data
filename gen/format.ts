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
    // console.log("rendering", node.type);
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
          "=" + (val_block ? "\n" : " ");
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
      const { parent } = node;

      // if an array element render gap
      if (parent.type === "array" && parent.expanded && !node.tag) {
        if (parent.gap !== undefined) {
          output.push({ str: parent.gap === "," ? ", " : parent.gap });
          parent.midline = !parent.gap.includes("\n");
          parent.gap = undefined;
        } else if (parent.midline) {
          output.push({ str: ", " });
        }
        if (!parent.midline) {
          node.str = "\t".repeat(node.depth) + node.str;
        }
        parent.midline = true;
      } else if (node.indent) {
        node.str = "\t".repeat(node.depth) + node.str;
      }

      delete node.parent;
      output.push(node);

      //
    } else if (node.type === "map" || node.type === "array") {
      // --- MAPS && ARRAYS ---
      const { parent } = node;

      // if an array element render gap
      if (parent.type === "array") {
        if (parent.gap !== undefined) {
          if (!parent.expanded) throw new Error("gaps have not been stripped");
          output.push({ str: parent.gap === "," ? ", " : parent.gap });
          parent.midline = !parent.gap.includes("\n");
          parent.gap = undefined;
        } else if (parent.midline) {
          output.push({ str: ", " });
        }
        if (!parent.midline) node.indent = true;
        parent.midline = true;
      }

      if (!node.expanded) {
        // remove gaps
        node.elements = node.elements.filter((el: any) => el.type !== "gap");
      }

      stack.push({
        type: "close",
        str: node.type === "map" ? ")" : "]",
        parent: node,
      });
      node.elements.reduceRight((st: any[], el: any, i: number) => {
        st.push(el);
        el.parent = node;
        el.depth = node.depth + 1;
        if (i > 0 && !node.expanded) {
          st.push({ type: "raw", str: ", " });
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
      if (node.parent.tag === null && node.parent.indent) {
        node.str = "\t".repeat(node.parent.depth) + node.str;
      }
      if (node.parent.expanded) node.str += "\n";
      output.push(node);
    } else if (node.type === "close") {
      if (node.parent.expanded) {
        if (node.parent.gap?.startsWith("\n")) {
          output.push({ str: node.parent.gap });
          node.parent.midline = undefined;
        }
        node.str = "\t".repeat(node.parent.depth) + node.str;
        if (node.parent.midline) node.str = "\n" + node.str;
      }
      output.push(node);
    } else if (node.type === "raw") {
      output.push(node);
    } else {
      throw node;
    }
  }

  // final newline
  if (output.length > 0 && !output.at(-1).str.endsWith("\n")) {
    output.push({ str: "\n" });
  }

  return output;
}

export function to_formatted_string(data: any) {
  return to_formatted_nodes(data).map((n) => n.str).join("");
}

if (import.meta.main) {
  const data = {
    type: "map",
    tag: null,
    expanded: true,
    top: true,
    elements: [],
  };

  console.log(data);
  console.log(to_formatted_nodes(data));
  console.log(to_formatted_string(data));
}
