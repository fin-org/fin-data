import { assertEquals } from "std/assert/mod.ts";
import { to_formatted_string } from "./format.ts";
import * as ast from "./ast.ts";

// TODO this is too verbose, simplify.
// How about PBTs that would improve this.

Deno.test({
  name: "gaps and comments",
  fn: () => {
    assertEquals(
      to_formatted_string({
        type: "top_level",
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
      }),
      "\n#abc\n#熞def\n#鏜\n#🐬\n\n#$.쒃\n",
    );
  },
});

Deno.test({
  name: "map_entries - same line",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "b" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " , " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "d" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: "\n\n , \n " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: " =\n" },
          val: { type: "symbol", str: "f" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "a = b, c = d, e = f\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "map_entries - separate lines",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "b" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "d" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " \n\n\n " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "f" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "a = b\nc = d\n\ne = f\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "map_entries - block vals",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "b" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: "," },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|d\n" },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: "\t, \n\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|f\n" },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "a = b, c =\n|d\n\ne =\n|f\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "map_entries - block keys",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "b" },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " , " },
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|c\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "d" },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: "\t, \n\n," },
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|e\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "f" },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "a = b\n|c\n= d\n|e\n= f\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "map_entries - block keys & vals",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        { type: "gap", str: " ,\t" },
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|a\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|b\n" },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: "\t,\n\t" },
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|c\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|d\n" },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: "\t, " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|f\n" },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "|a\n=\n|b\n\n|c\n=\n|d\ne =\n|f\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "inline maps",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        { type: "gap", str: " ,\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: ",\t\t=" },
          val: {
            type: "map",
            tag: undefined,
            expanded: false,
            elements: [],
          },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " ,\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "b" },
          eq: { type: "eq", str: "=" },
          val: {
            type: "map",
            tag: { type: "symbol", str: "sym" },
            expanded: false,
            elements: [
              {
                type: "map_entry",
                key: { type: "number", str: "1" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "2" },
                expanded: false,
                midline: undefined,
                gap: undefined,
              },
            ],
          },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " \n\t\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          midline: undefined,
          gap: undefined,
          expanded: false,
          eq: { type: "eq", str: "=" },
          val: {
            type: "map",
            tag: undefined,
            expanded: false,
            elements: [
              {
                type: "map_entry",
                key: { type: "number", str: "1" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "2" },
                expanded: false,
                midline: undefined,
                gap: undefined,
              },
              { type: "gap", str: " \t " },
              {
                type: "map_entry",
                key: { type: "number", str: "3" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "4" },
                expanded: false,
                midline: undefined,
                gap: undefined,
              },
              { type: "gap", str: "," },
              {
                type: "map_entry",
                key: { type: "number", str: "5" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "6" },
                expanded: false,
                midline: undefined,
                gap: undefined,
              },
              { type: "gap", str: "\n\t" },
              {
                type: "map_entry",
                key: { type: "number", str: "7" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "8" },
                expanded: false,
                midline: undefined,
                gap: undefined,
              },
              { type: "gap", str: "\n\n\n  \t, " },
            ],
          },
        },
      ],
    };
    const res =
      "\na = (), b = sym(1 = 2)\n\nc = (1 = 2, 3 = 4, 5 = 6, 7 = 8)\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "expanded maps",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          midline: undefined,
          gap: undefined,
          val: {
            type: "map",
            tag: undefined,
            expanded: true,
            elements: [
              { type: "comment", str: "#\n\t", expanded: true },
              {
                type: "map_entry",
                key: { type: "symbol", str: "b" },
                eq: { type: "eq", str: "=" },
                midline: undefined,
                gap: undefined,
                val: {
                  type: "map",
                  tag: { type: "symbol", str: "tag" },
                  expanded: true,
                  elements: [
                    { type: "comment", str: "#\n\t", expanded: true },
                    {
                      type: "map_entry",
                      key: { type: "number", str: "1" },
                      eq: { type: "eq", str: "=" },
                      val: { type: "number", str: "2" },
                      expanded: false,
                      midline: undefined,
                      gap: undefined,
                    },
                    {
                      type: "map_entry",
                      key: {
                        type: "map",
                        tag: { type: "symbol", str: "_" },
                        elements: [],
                        expanded: false,
                      },
                      eq: { type: "eq", str: "=" },
                      val: { type: "number", str: "3" },
                      expanded: false,
                      midline: undefined,
                      gap: undefined,
                    },
                    { type: "gap", str: "\n\n" },
                  ],
                },
                expanded: true,
              },
            ],
          },
          expanded: true,
        },
      ],
    };
    const res =
      "a = (\n\t#\n\tb = tag(\n\t\t#\n\t\t1 = 2\n\t\t_() = 3\n\n\t)\n)\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "case 1",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|a\n" },
          eq: { type: "eq", str: "\n\n=\n," },
          val: {
            type: "map",
            tag: undefined,
            expanded: false,
            elements: [
              { type: "gap", str: " " },
              {
                type: "map_entry",
                key: { type: "number", str: "-7" },
                eq: { type: "eq", str: "\n ,,=,  , " },
                val: { type: "number", str: "-0.8" },
                expanded: false,
                midline: undefined,
                gap: undefined,
              },
            ],
          },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: "\n\n" },
      ],
    };
    const res = "|a\n= (-7 = -0.8)\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "inline arrays",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        { type: "gap", str: " ,\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: ",\t\t=" },
          val: {
            type: "array",
            tag: undefined,
            expanded: false,
            elements: [],
          },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " ,\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "b" },
          eq: { type: "eq", str: "=" },
          val: {
            type: "array",
            tag: { type: "symbol", str: "sym" },
            expanded: false,
            elements: [
              { type: "gap", str: "\n, " },
              { type: "number", str: "1" },
              { type: "gap", str: "\n, " },
            ],
          },
          expanded: false,
          midline: undefined,
          gap: undefined,
        },
        { type: "gap", str: " \n\t\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          eq: { type: "eq", str: "=" },
          midline: undefined,
          gap: undefined,
          expanded: false,
          val: {
            type: "array",
            tag: undefined,
            expanded: false,
            elements: [
              { type: "number", str: "1" },
              { type: "gap", str: " \t " },
              { type: "number", str: "2" },
              { type: "gap", str: "," },
              { type: "number", str: "3" },
              { type: "gap", str: "\n\t" },
              { type: "number", str: "4" },
              { type: "gap", str: "\n\n\n  \t, " },
            ],
          },
        },
      ],
    };
    const res = "\na = [], b = sym[1]\n\nc = [1, 2, 3, 4]\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "expanded arrays",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          val: {
            type: "array",
            tag: undefined,
            expanded: true,
            elements: [
              { type: "gap", str: " \n, \t" },
              { type: "number", str: "98" },
              { type: "gap", str: ", \n\t\n " },

              {
                type: "array",
                tag: { type: "symbol", str: "b" },
                expanded: true,
                elements: [
                  { type: "gap", str: ",, " },
                  { type: "comment", str: "#\n" },
                  { type: "gap", str: " \t, " },
                  { type: "symbol", str: "c" },
                  { type: "gap", str: " , " },
                ],
              },
              { type: "gap", str: "\n\n" },
            ],
          },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "a = [\n\n\t98, b[\n\t\t#\n\t\tc\n\t]\n\n]\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "case 2",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          val: {
            type: "array",
            tag: undefined,
            expanded: true,
            elements: [
              { type: "comment", str: "#\n" },
              {
                type: "array",
                tag: { type: "symbol", str: "b" },
                expanded: false,
                elements: [],
              },
              {
                type: "map",
                tag: undefined,
                expanded: false,
                elements: [],
              },
              { type: "number", str: "98" },
            ],
          },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "a = [\n\t#\n\tb[], (), 98\n]\n";
    assertEquals(to_formatted_string(data), res);
  },
});

Deno.test({
  name: "case 3",
  fn: () => {
    const data: ast.TopLevel = {
      type: "top_level",
      expanded: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: "=" },
          val: {
            type: "array",
            tag: { type: "symbol", str: "i" },
            expanded: true,
            elements: [
              { type: "escaped_string", str: "98" },
              { type: "gap", str: "\n" },
              { type: "symbol", str: "z4" },
              { type: "comment", str: "#\n" },
            ],
          },
          expanded: true,
          midline: undefined,
          gap: undefined,
        },
      ],
    };
    const res = "a = i[\n\t98\n\tz4\n\t#\n]\n";
    assertEquals(to_formatted_string(data), res);
  },
});