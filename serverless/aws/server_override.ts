import { ServerOrServerlessArgs } from "./interface";

export default async function ({
  defaultPort,
  initServer,
}: ServerOrServerlessArgs) {
  const app = await initServer();
  const port = parseInt(process.env.PORT || "", undefined) || defaultPort;
  app.listen(port, () => console.log(`Listening to ${port}`));
}
