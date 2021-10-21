import express from "express";
import { ServerOrServerlessArgs } from "./interface";

export default async function ({
  defaultPort,
  handlers,
}: ServerOrServerlessArgs) {
  const app = express();

  for (const handlerName in handlers) {
    app.use(`/${handlerName}`, handlers[handlerName]);
  }

  const port = parseInt(process.env.PORT || "", undefined) || defaultPort;
  app.listen(port, () => console.log(`Listening to ${port}`));
  return app;
}
