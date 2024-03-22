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
  midline: undefined;
  gap: undefined;
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
  ext: true;
  tag: ExtendedSymbol;
}

export interface ExtendedArray extends Array {
  ext: true;
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

export interface DiscardedMap extends ExtendedMap {
  discarded: true;
}

export interface DiscardedArray extends ExtendedArray {
  discarded: true;
}
