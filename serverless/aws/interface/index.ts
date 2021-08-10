import express from "express";

export interface ServerOrServerlessArgs {
  readonly defaultPort: number;
  initServer(): Promise<express.Express>;
}
