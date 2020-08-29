import serverless, { Handler } from "serverless-http";
import { ServerOrServerlessArgs } from "./interface";

export default function ({ initServer }: ServerOrServerlessArgs) {
  return async function (...args: Parameters<Handler>) {
    const app = await initServer();
    const handler = await serverless(app)(...args);
    return handler;
  };
}
