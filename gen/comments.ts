import * as fc from "fast-check";
import { raw_block } from "./raw_strings.ts";

export const comment = raw_block("comment", "#");

if (import.meta.main) {
  console.log("a sample of comments...");
  for (const s of fc.sample(comment, 20)) {
    console.log(s);
  }
}
