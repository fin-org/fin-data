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

// push elements onto stack and record parent/depth info
function push_all(stack: any[], parent: any, ...elements: any[]) {
  elements.reduceRight((st: any[], el: any) => {
    el.parent = parent;
    el.depth = (parent.depth ?? -1) + 1;
    st.push(el);
    return st;
  }, stack);
  return stack;
}

export function to_string(data: any) {
  const stack = [data];
  const output = [];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.top) {
      push_all(stack, node, ...node.elements);
    } else if (node.type === "map") {
      stack.push({ str: ")" });
      push_all(stack, node, node.elements);
      push_all(stack, node, ...node.elements);
      stack.push({ str: "(" });
      if (node.tag) stack.push(node.tag);
    } else if (node.type === "map_entry") {
      stack.push(node.val);
      stack.push(node.eq);
      stack.push(node.key);
    } else if (node.type === "array") {
      stack.push({ str: "]" });
      push_all(stack, node, ...node.elements);
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
      push_all(stack, node, ...node.elements);
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
    } else if (node.type === "comment") {
      // --- COMMENTS ---
      const { parent } = node;

      // check parent is expanded
      if (!parent.expanded) throw new Error("parent not expanded");

      // render the correct gap
      if (parent.midline) {
        output.push({ str: parent.gap.startsWith("\n") ? parent.gap : "\n" });
        parent.midline = false;
      } else if (parent.gap) {
        output.push({ str: parent.gap });
      }

      // render the comment with correct indentation
      const comment: string = node.str.split("\n")
        .filter((l: string) => l.includes("#"))
        .map((l: string) => `${"\t".repeat(node.depth)}${l.trimStart()}`)
        .join("\n");
      node.str = comment + "\n";
      delete node.parent;
      output.push(node);

      // reset the gap
      parent.gap = undefined;

      // ---
    } else if (node.type === "TODO") {
      // --- MAP ENTRIES ---

      if (node.parent.expanded) {
        // expanded
        const is_key_block = blocks.has(node.key.type);
        const is_val_block = blocks.has(node.val.type);
        if (is_key_block && is_val_block) {
          // block
          // =
          // block
        } else if (!is_key_block && !is_val_block) {
          // non-block = non-block
        } else if (is_key_block) {
          // block
          // = non-block
        } else {
          // non-block =
          // block
        }
      } else {
        // inline
        if (node.expanded) throw new Error("parent not expanded");
      }

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
    elements: [
      { type: "gap", str: "" },
      { type: "gap", str: " \t\n" },
      { type: "gap", str: "\n \t," },
      {
        type: "comment",
        str: "#𐟧𹤮򛿥\n\t\t \t #熞񂲦𙟩󵘜򽌧򩢮񦣥\n\t \t\t\t #鏜񴣘󌕛𽤄􀣮󌀾񆊱\n\t #񛂠𚊓򴾿򈟕𿑄񶫉񯮹򘣑\n",
        expanded: true,
      },
      { type: "gap", str: ",\n " },
      { type: "comment", str: "#$񛿛򩼀.񬷡򇭅쒃\n \t\t", expanded: true },
      { type: "gap", str: "" },
      { type: "gap", str: "," },
    ],
    expanded: true,
    top: true,
  };

  // {
  //   type: "map",
  //   tag: null,
  //   elements: [
  //     {
  //       type: "comment",
  //       str: "#󗒉򾯹򀘷󸞧𶜁𶠔􉚓􈋤񺫉򢂦\n" +
  //         "\t    #\n" +
  //         "\t  \t #󚢽򖰶򺋨馽򖲳􇆅􎜲󘌍\n" +
  //         "\t\t   #󠥇񯽱򤾘\n" +
  //         "#ᦽ񅀮󿌋\n" +
  //         "#񓑋񣇈\n" +
  //         "\t \t\t \t#򰩏􌷂􊑦󩹕𹛈𱦵\n" +
  //         "  \t ",
  //       expanded: true,
  //     },
  //     {
  //       type: "map_entry",
  //       key: { type: "raw_string", str: "|𿹧񲒓􊒞􈥍󴢑\n\t ", expanded: true },
  //       assoc: { type: "assoc", str: "\t\n=" },
  //       val: { type: "symbol", str: "false" },
  //       expanded: true,
  //     },
  //     {
  //       type: "map_entry",
  //       key: { type: "number", str: "0.3270864677e-0" },
  //       assoc: { type: "assoc", str: "  =" },
  //       val: { type: "number", str: "59210689302.51621495432e-681" },
  //       expanded: false,
  //     },
  //   ],
  //   expanded: true,
  //   top: true,
  // };
  console.log(data);
  console.log(to_formatted_nodes(data));
  console.log(to_formatted_string(data));
}
