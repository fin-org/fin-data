export type Value = Primitive | Collection | Extension;

// PRIMITIVES

export type Primitive = Symbol | Number | EscapedString | RawString;

interface Base {
  str: string;
  expanded?: boolean;
  block?: boolean;
  parent?: Parent;
}

export interface Symbol extends Base {
  type: "symbol";
}

export interface Number extends Base {
  type: "number";
}

export interface EscapedString extends Base {
  type: "escaped_string";
}

export interface RawString extends Base {
  type: "raw_string";
}

// COLLECTIONS

export type Collection = Map | Array;
export type MapElement = MapEntry | NonValue;
export type ArrayElement = Value | NonValue;
export type Parent = MapEntry | Array;

export interface Map {
  type: "map";
  tag?: Symbol;
  expanded: boolean;
  elements: MapElement[];
}

export interface MapEntry {
  type: "map_entry";
  key: Value;
  eq: Eq;
  val: Value;
  expanded: boolean;
}

export interface Eq {
  type: "eq";
  str: string;
}

export interface Array {
  type: "array";
  tag?: Symbol;
  expanded: boolean;
  elements: ArrayElement[];
}

export interface TopLevel extends Map {
  top: true;
}

// EXTENSIONS

export type Extension = ExtendedSymbol | ExtendedMap | ExtendedArray;

export interface ExtendedSymbol extends Symbol {
  ext: true;
}

export interface ExtendedMap extends Map {
  ext: true;
  tag: Symbol;
}

export interface ExtendedArray extends Array {
  ext: true;
  tag: Symbol;
}

// NON VALUES

export type NonValue =
  | Comment
  | Gap
  | DiscardedMap
  | DiscardedArray
  | DiscardedSymbol;

export interface Comment extends Base {
  type: "comment";
}

export interface Gap extends Base {
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
