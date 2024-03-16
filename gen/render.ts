// TODO validate generated data. can zod generate these types?

function requires_space(a: any, b: any) {
  if (a?.type === "symbol" && b?.type === "symbol") return true;
  if (a?.type === "symbol" && b?.type === "number") return true;
  if (a?.type === "number" && b?.type === "symbol") return true;
  if (a?.type === "number" && b?.type === "number") return true;
  return false;
}

export function to_string(data: any) {
  const stack = [data];
  const output = [];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.top) {
      stack.push(...node.elements);
    } else if (node.type === "map") {
      if (node.tag) stack.push(node.tag);
      stack.push({ str: "(" });
      stack.push(...node.elements);
      stack.push({ str: ")" });
    } else if (node.type === "map_entry") {
      stack.push(node.key);
      stack.push(node.assoc);
      stack.push(node.val);
    } else if (node.type === "array") {
      if (node.tag) stack.push(node.tag);
      stack.push({ str: "[" });
      stack.push(...node.elements);
      stack.push({ str: "]" });
    } else if (node.str !== undefined) {
      if (requires_space(node, output.at(-1))) {
        output.push({ type: "space", str: " " });
      }
      output.push(node.str);
    } else {
      throw node;
    }
  }
  return output.reverse().join("");
}

export function to_formatted_string(data: any) {
  // TODO
}
