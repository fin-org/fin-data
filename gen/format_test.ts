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
