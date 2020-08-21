import { GraphSONReader, GraphSONWriter } from ".";
export const GREMLIN_TYPE_KEY = "@type";
export const GREMLIN_VALUE_KEY = "@value";
export const GREMLIN_G_KEY = { MAP: "g:Map", TREE: "g:Tree" };

export abstract class GremlinTypeSerializer {
  protected reader?: GraphSONReader;
  protected writer?: GraphSONWriter;
  abstract deserialize(object: Readonly<{ "@value": unknown }>): unknown;
}

/**
 * Use this serializer in place of a MapSerializer so that Javascript objects
 * are returned instead of Maps.
 */
export class GremlinObjectSerializer extends GremlinTypeSerializer {
  deserialize(...[obj]: Parameters<GremlinTypeSerializer["deserialize"]>) {
    const v = obj[GREMLIN_VALUE_KEY];
    if (!Array.isArray(v)) throw new Error("Expected Array, obtained: " + v);
    const result: { [x: string]: unknown } = {};

    for (let i = 0; i < v.length; i += 2) {
      result[this.reader!.read(v[i]) as string] = this.reader!.read(v[i + 1]);
    }

    return result;
  }

  serialize(map: { [x: string]: any }) {
    const arr: any[] = [];

    for (const k in map) {
      arr.push(this.writer!.adaptObject(k));
      arr.push(this.writer!.adaptObject(map[k]));
    }

    return {
      [GREMLIN_TYPE_KEY]: "g:Map",
      [GREMLIN_VALUE_KEY]: arr,
    };
  }

  canBeUsedFor(value: any) {
    return typeof value === "object" && value != null;
  }
}

export class GremlinTreeSerializer extends GremlinTypeSerializer {
  deserialize(...[obj]: Parameters<GremlinTypeSerializer["deserialize"]>) {
    const v = obj[GREMLIN_VALUE_KEY];
    if (!Array.isArray(v)) throw new Error("Expected Array, obtained: " + v);

    const result: any[] = [];

    for (const v1 of v) {
      if ("key" in v1 && "value" in v1) {
        const { key, value } = v1;

        const vertexResult = this.formatVertexResult(
          this.reader!.read(key) as object,
          this.reader!.read(value) as object
        );

        result.push(vertexResult);
      } else throw new Error("Expected key and value, obtained: " + v1);
    }

    return result;
  }

  protected formatVertexResult(vertex: any, outVertices: any): object {
    return { vertex, outVertices };
  }
}
