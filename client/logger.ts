import winston, { transports } from "winston";
import { analyzeError } from "../utils";

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
      logger.error({ ...meta, ...analyzedError, error, message });
    },
    i: async function ({
      message,
      meta,
    }: Readonly<{ message: string; meta?: {} }>) {
      logger.info({ ...meta, message });
    },
  };
}
