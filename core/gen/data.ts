const input = top_level.map(to_string);

if (import.meta.main) {
  console.log("a sample of arrays...");
  for (const s of fc.sample(top_level, 1)) {
    console.log(s);
    console.log();
    console.log(to_string(s));
    console.log();
    console.log(to_formatted_string(s));
  }
}
