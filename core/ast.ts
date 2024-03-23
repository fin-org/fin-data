export type Value = Primitive | Collection | Extension;
export type Node = TopLevel | Value | NonValue | MapEntry | Extra;

// PRIMITIVES

export type Primitive = Symbol | Number | EscapedString | RawString;

export interface Output {
  type: string;
  str: string;
  expanded?: boolean;
  block?: boolean;
  parent?: Parent;
  depth?: number;
  indent?: boolean;
}

export interface Symbol extends Output {
  type: "symbol";
  tag?: boolean;
  indent?: boolean;
}

export interface Number extends Output {
  type: "number";
}

export interface EscapedString extends Output {
  type: "escaped_string";
}

export interface RawString extends Output {
  type: "raw_string";
}

// COLLECTIONS

export type Collection = Map | Array;
export type MapElement = MapEntry | NonValue;
export type ArrayElement = Value | NonValue;
export type Parent = MapEntry | Array | Map | TopLevel;

export type Gaps = "\n" | "\n\n" | ", ";

export interface Map {
  type: "map";
  tag?: Symbol;
  expanded: boolean;
  elements: MapElement[];
  parent?: Parent;
  depth?: number;
  midline?: boolean;
  gap?: Gaps;
  indent?: boolean;
}

export interface TopLevel {
  type: "top_level";
  expanded: true;
  elements: MapElement[];
  midline?: boolean;
  gap?: Gaps;
}

export interface MapEntry {
  type: "map_entry";
  key: Value;
  eq: Eq;
  val: Value;
  expanded: boolean;
  parent?: Parent;
  depth?: number;
  midline?: undefined;
  gap?: undefined;
  indent?: boolean;
}

export interface Array {
  type: "array";
  tag?: Symbol;
  expanded: boolean;
  elements: ArrayElement[];
  parent?: Parent;
  depth?: number;
  midline?: boolean;
  gap?: Gaps;
  indent?: boolean;
}

// EXTRA

export type Extra = Eq | Open | Close;

export interface Eq extends Output {
  type: "eq";
}

export interface Open extends Output {
  type: "open";
}

export interface Close extends Output {
  type: "close";
}

// EXTENSIONS

export type Extension = ExtendedSymbol | ExtendedMap | ExtendedArray;

export interface ExtendedSymbol extends Symbol {
  ext: true;
}

export interface ExtendedMap extends Map {
  tag: ExtendedSymbol;
}

export interface ExtendedArray extends Array {
  tag: ExtendedSymbol;
}

// NON VALUES

export type NonValue =
  | Comment
  | Gap
  | DiscardedMap
  | DiscardedArray
  | DiscardedSymbol;

export interface Comment extends Output {
  type: "comment";
}

export interface Gap extends Output {
  type: "gap";
}

export interface DiscardedSymbol extends ExtendedSymbol {
  discarded: true;
}

export interface DiscardedMap extends Map {
  tag: DiscardedSymbol;
}

export interface DiscardedArray extends Array {
  tag: DiscardedSymbol;
}

// HELPER FNS

export function gap(str: string): Gap {
  return { type: "gap", str };
}

export function sym(str: string): Symbol {
  return { type: "symbol", str };
}

export function esym(str: string): ExtendedSymbol {
  if (
    (!str.startsWith("fin:") && !str.startsWith("ext:")) || str.endsWith("_")
  ) throw str;
  return { type: "symbol", str, ext: true };
}

export function dsym(str: string): DiscardedSymbol {
  if (
    (!str.startsWith("fin:") && !str.startsWith("ext:")) || !str.endsWith("_")
  ) throw new Error("bad symbol");
  return { type: "symbol", str, ext: true, discarded: true };
}

export function num(str: string): Number {
  return { type: "number", str };
}

export function raw_str(str: string): RawString {
  return { type: "raw_string", str, expanded: true };
}

export function esc_str(str: string): EscapedString {
  return { type: "escaped_string", str };
}

export function com(str: string): Comment {
  return { type: "comment", expanded: true, str };
}

export function top(...elements: MapElement[]): TopLevel {
  return { type: "top_level", elements, expanded: true };
}

export function kv(key: Value, val: Value, eq?: string): MapEntry {
  return {
    type: "map_entry",
    key,
    eq: { type: "eq", str: eq ?? "=" },
    val,
    expanded: Boolean(key.expanded || val.expanded),
  };
}

export function map(...elements: MapElement[]): Map {
  return {
    type: "map",
    elements,
    expanded: elements.some((e) => e.expanded),
  };
}

export function tmap(
  tag: Symbol | ExtendedSymbol | DiscardedSymbol,
  ...elements: MapElement[]
): Map | ExtendedMap | DiscardedMap {
  return {
    type: "map",
    tag,
    elements,
    expanded: elements.some((e) => e.expanded),
  };
}

export function arr(...elements: ArrayElement[]): Array {
  return {
    type: "array",
    elements,
    expanded: elements.some((e) => e.expanded),
  };
}

export function tarr(
  tag: Symbol | ExtendedSymbol | DiscardedSymbol,
  ...elements: ArrayElement[]
): Array | ExtendedMap | DiscardedMap {
  return {
    type: "array",
    tag,
    elements,
    expanded: elements.some((e) => e.expanded),
  };
}
