import { assertEquals } from "std/assert/mod.ts";
import { to_formatted_string } from "./format.ts";

Deno.test({
  name: "gaps and comments",
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

Deno.test({
  name: "map_entries - same line",
  fn: () => {
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
        { type: "gap", str: "\n\n , \n " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: " =\n" },
          val: { type: "symbol", str: "f" },
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
        { type: "gap", str: " " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "d" },
        },
        { type: "gap", str: " \n\n\n " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "f" },
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
        { type: "gap", str: "," },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|d\n" },
          expanded: true,
        },
        { type: "gap", str: "\t, \n\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|f\n" },
          expanded: true,
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
          key: { type: "raw_string", str: "|c\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "d" },
          expanded: true,
        },
        { type: "gap", str: "\t, \n\n," },
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|e\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "symbol", str: "f" },
          expanded: true,
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
    const data = {
      type: "map",
      tag: null,
      expanded: true,
      top: true,
      elements: [
        { type: "gap", str: " ,\t" },
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|a\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|b\n" },
          expanded: true,
        },
        { type: "gap", str: "\t,\n\t" },
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|c\n" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|d\n" },
          expanded: true,
        },
        { type: "gap", str: "\t, " },
        {
          type: "map_entry",
          key: { type: "symbol", str: "e" },
          eq: { type: "eq", str: "=" },
          val: { type: "raw_string", str: "|f\n" },
          expanded: true,
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
    const data = {
      type: "map",
      tag: null,
      expanded: true,
      top: true,
      elements: [
        { type: "gap", str: " ,\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "a" },
          eq: { type: "eq", str: ",\t\t=" },
          val: {
            type: "map",
            tag: null,
            expanded: false,
            elements: [],
          },
          expanded: false,
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
              },
            ],
          },
          expanded: false,
        },
        { type: "gap", str: " \n\t\n" },
        {
          type: "map_entry",
          key: { type: "symbol", str: "c" },
          eq: { type: "eq", str: "=" },
          val: {
            type: "map",
            tag: null,
            expanded: false,
            elements: [
              {
                type: "map_entry",
                key: { type: "number", str: "1" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "2" },
                expanded: false,
              },
              { type: "gap", str: " \t " },
              {
                type: "map_entry",
                key: { type: "number", str: "3" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "4" },
                expanded: false,
              },
              { type: "gap", str: "," },
              {
                type: "map_entry",
                key: { type: "number", str: "5" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "6" },
                expanded: false,
              },
              { type: "gap", str: "\n\t" },
              {
                type: "map_entry",
                key: { type: "number", str: "7" },
                eq: { type: "eq", str: "=" },
                val: { type: "number", str: "8" },
                expanded: false,
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
          val: {
            type: "map",
            tag: null,
            expanded: true,
            elements: [
              { type: "comment", str: "#\n\t", expanded: true },
              {
                type: "map_entry",
                key: { type: "symbol", str: "b" },
                eq: { type: "eq", str: "=" },
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
    const data = {
      type: "map",
      tag: null,
      expanded: true,
      top: true,
      elements: [
        {
          type: "map_entry",
          key: { type: "raw_string", str: "|a\n" },
          eq: { type: "eq", str: "\n\n=\n," },
          val: {
            type: "map",
            tag: null,
            expanded: false,
            elements: [
              { type: "gap", str: " " },
              {
                type: "map_entry",
                key: { type: "number", str: "-7" },
                eq: { type: "eq", str: "\n ,,=,  , " },
                val: { type: "number", str: "-0.8" },
              },
            ],
          },
          expanded: true,
        },
        { type: "gap", str: "\n\n" },
      ],
    };
    const res = "|a\n= (-7 = -0.8)\n";
    assertEquals(to_formatted_string(data), res);
  },
});
