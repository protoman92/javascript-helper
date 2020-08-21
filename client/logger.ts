import { analyzeError } from "../utils";
import winston, { transports } from "winston";

export default function () {
  const logger = winston.createLogger({
    transports: [new transports.Console()],
  });

  return {
    e: async function ({
      error,
      message,
      meta,
    }: Readonly<{
      error: any;
      message?: string;
      meta?: {};
    }>) {
      const { message: errorMessage, ...analyzedError } = analyzeError(error);
      message = `${message}: ${errorMessage}`;
      logger.error({ ...meta, ...analyzedError, message });
    },
    i: async function ({
      message,
      meta,
    }: Readonly<{ message: string; meta?: {} }>) {
      logger.info({ ...meta, message });
    },
  };
}
