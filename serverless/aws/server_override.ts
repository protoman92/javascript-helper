import { ServerOrServerlessArgs } from "./interface";

export default async function ({
  defaultPort,
  initServer,
}: ServerOrServerlessArgs) {
  const { PORT = "" } = process.env;
  const app = await initServer();
  const port = parseInt(PORT, undefined) || defaultPort;
  app.listen(port, () => console.log(`Listening to ${port}`));
}
