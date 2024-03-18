import { assertEquals } from "std/assert/mod.ts";
import { to_formatted_string, to_string } from "./render.ts";

Deno.test({
  name: "to_string - example 1",
  fn: () => {
    assertEquals(
      to_string({
        type: "map",
        expanded: true,
        tag: null,
        top: true,
        elements: [
          { type: "comment", expanded: true, str: "# example\n" },
          {
            type: "map_entry",
            key: { type: "number", str: "98" },
            eq: { type: "eq", str: " = " },
            val: { type: "escaped_string", str: '"foo"' },
          },
        ],
      }),
      '# example\n98 = "foo"',
    );
  },
});

Deno.test({
  name: "format - gaps and comments",
  fn: () => {
    assertEquals(
      to_formatted_string({
        type: "map",
        tag: null,
        elements: [
          { type: "gap", str: "" },
          { type: "gap", str: " \t\n" },
          { type: "gap", str: "\n \t," },
          {
            type: "comment",
            str: "#abc\n\t\t \t #熞def\n\t \t\t\t #鏜\n\t #🐬\n",
            expanded: true,
          },
          { type: "gap", str: ",\n \n " },
          { type: "comment", str: "#$.쒃\n \t\t", expanded: true },
          { type: "gap", str: "" },
          { type: "gap", str: "," },
        ],
        expanded: true,
        top: true,
      }),
      "\n#abc\n#熞def\n#鏜\n#🐬\n\n#$.쒃\n",
    );
  },
});
