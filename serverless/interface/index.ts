import { Application } from "../../express";

export interface ServerOrServerlessArgs {
  readonly defaultPort: number;
  initServer(): Promise<Application>;
}
