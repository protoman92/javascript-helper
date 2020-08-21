import { driver as gdriver, process, structure } from "gremlin";
import {
  GremlinObjectSerializer,
  GremlinTreeSerializer,
  GremlinTypeSerializer,
  GREMLIN_G_KEY,
} from "./TypeSerializer";
export * from "./TypeSerializer";

export const PlainTextSaslAuthenticator =
  gdriver.auth.PlainTextSaslAuthenticator;

export interface GraphSONReader {
  read(object: unknown): unknown;
}

export interface GraphSONWriter {
  adaptObject(object: unknown): unknown;
}

declare module "gremlin" {
  namespace process {
    interface GraphTraversal {
      properties<T>(obj: T): this;
    }
  }

  namespace structure {
    namespace io {
      class GraphSON2Writer {
        getDefaultSerializers(): readonly typeof GremlinTypeSerializer[];
      }

      class GraphSON2Reader {
        getDefaultDeserializers(): Readonly<{
          [x: string]: typeof GremlinTypeSerializer;
        }>;
      }

      class GraphSON3Writer extends GraphSON2Writer {}
      class GraphSON3Reader extends GraphSON2Reader {}
    }
  }
}

const varargsProps = process.GraphTraversal.prototype.properties;

process.GraphTraversal.prototype.properties = function (...args: any[]) {
  if (args.length === 1) {
    const varargs = Object.entries(args[0]).reduce(
      (acc, [k, v]) => [...acc, k, v],
      [] as any[]
    );

    return varargsProps.bind(this)(...varargs);
  }

  return varargsProps.bind(this)(...args);
};

export type GremlinClient = ReturnType<typeof createGremlinClient>;

export interface GremlinClientArgs {
  readonly authenticator?: gdriver.auth.Authenticator;
  readonly endpoint: string;
  readonly graphSONVersion: string;
  readonly processor?: "cypher" | "gremlin";
  readonly rejectUnauthorized: boolean;
  readonly shouldLogQuery?: boolean;
  readonly traversalSource?: "g";
  readonly typeDeserializers?: Readonly<{
    [x: string]: typeof GremlinTypeSerializer;
  }>;
}

export default function createGremlinClient({
  endpoint,
  graphSONVersion,
  shouldLogQuery = false,
  typeDeserializers = {},
  ...additionalConfig
}: GremlinClientArgs) {
  class CustomGraphSON2Reader extends structure.io.GraphSON2Reader {
    getDefaultDeserializers() {
      return {
        ...super.getDefaultDeserializers(),
        [GREMLIN_G_KEY.TREE]: GremlinTreeSerializer,
        ...typeDeserializers,
      };
    }
  }

  class CustomGraphSON2Writer extends structure.io.GraphSON2Writer {}

  class CustomGraphSON3Reader extends structure.io.GraphSON3Reader {
    getDefaultDeserializers() {
      return {
        ...super.getDefaultDeserializers(),
        [GREMLIN_G_KEY.MAP]: GremlinObjectSerializer,
        [GREMLIN_G_KEY.TREE]: GremlinTreeSerializer,
        ...typeDeserializers,
      };
    }
  }

  class CustomGraphSON3Writer extends structure.io.GraphSON3Writer {
    getDefaultSerializers() {
      return [...super.getDefaultSerializers(), GremlinObjectSerializer];
    }
  }

  let mimeType: string;
  let reader: structure.io.GraphSON2Reader;
  let writer: structure.io.GraphSON2Writer;

  switch (graphSONVersion) {
    case "2":
      mimeType = "application/vnd.gremlin-v2.0+json";
      reader = new CustomGraphSON2Reader();
      writer = new CustomGraphSON2Writer();
      break;

    case "3":
    default:
      mimeType = "application/vnd.gremlin-v3.0+json";
      reader = new CustomGraphSON3Reader();
      writer = new CustomGraphSON3Writer();
      break;
  }

  const config = { ...additionalConfig, mimeType, reader, writer };
  const driver = new gdriver.DriverRemoteConnection(endpoint, config);
  const client = new gdriver.Client(endpoint, config);
  const g = process.AnonymousTraversalSource.traversal().withRemote(driver);
  let didOpenDriver = false;
  let didOpenClient = false;

  return {
    process,
    g: async function () {
      if (!didOpenDriver) {
        await driver.open();
        didOpenDriver = true;
      }

      return g;
    },
    submit: async function <T = unknown>(
      ...args: Parameters<typeof client["submit"]>
    ) {
      if (!didOpenClient) {
        await client.open();
        didOpenClient = true;
      }

      if (shouldLogQuery) console.log(args[0]);
      const result: gdriver.ResultSet = await client.submit(...args);
      return result.toArray() as T[];
    },
  };
}
