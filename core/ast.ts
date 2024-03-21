type Value = Primitive | Collection | Extension;

// PRIMITIVES

type Primitive = Symbol | Number | EscapedString | RawString;

interface Symbol {
  type: "symbol";
  str: string;
  parent?: Parent;
}

interface Number {
  type: "number";
  str: string;
  parent?: Parent;
}

interface EscapedString {
  type: "escaped_string";
  str: string;
  parent?: Parent;
}

interface RawString {
  type: "raw_string";
  expanded: true;
  block: true;
  str: string;
  parent?: Parent;
}

// COLLECTIONS

type Collection = Map | Array;
type MapElement = MapEntry | NonValue;
type ArrayElement = Value | NonValue;
type Parent = MapEntry | Array;

interface Map {
  type: "map";
  tag?: Symbol;
  expanded: boolean;
  elements: MapElement[];
}

interface MapEntry {
  type: "map_entry";
  key: Value;
  eq: Eq;
  val: Value;
  expanded: boolean;
}

interface Eq {
  type: "eq";
  str: string;
}

interface Array {
  type: "array";
  tag?: Symbol;
  expanded: boolean;
  elements: ArrayElement[];
}

// EXTENSIONS

type Extension = ExtendedSymbol | ExtendedMap | ExtendedArray;

interface ExtendedSymbol extends Symbol {
  ext: true;
}

interface ExtendedMap extends Map {
  ext: true;
  tag: Symbol;
}

interface ExtendedArray extends Array {
  ext: true;
  tag: Symbol;
}

// NON VALUES

type NonValue = Comment | Gap | DiscardedMap | DiscardedArray | DiscardedSymbol;

interface Comment {
  type: "comment";
  expanded: true;
  block: true;
  str: string;
  parent?: Parent;
}

interface Gap {
  type: "gap";
  str: string;
  parent?: Parent;
}

interface DiscardedSymbol extends ExtendedSymbol {
  discarded: true;
}

interface DiscardedMap extends ExtendedMap {
  discarded: true;
}

interface DiscardedArray extends ExtendedArray {
  discarded: true;
}
