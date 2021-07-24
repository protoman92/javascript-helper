import express from "express";

export interface ServerOrServerlessArgs {
  readonly defaultPort: number;
  readonly handlers: Record<string, express.Handler>;
}
