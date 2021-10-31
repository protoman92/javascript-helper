import { analyzeError } from "@haipham/javascript-helper-utils";
import winston, { transports } from "winston";

export type Logger = ReturnType<typeof createLogger>;

export function createLogger() {
  const logger = winston.createLogger({
    format: winston.format.json({ space: 4 }),
    transports: [new transports.Console()],
  });

  function formatMessageToLog(args: any) {
    return args;
  }

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

      const messageToLog = formatMessageToLog({
        ...meta,
        ...analyzedError,
        error,
        message,
      });

      logger.error(messageToLog);
    },
    i: async function ({
      message,
      meta,
    }: Readonly<{ message: string; meta?: {} }>) {
      const messageToLog = formatMessageToLog({ ...meta, message });
      logger.info(messageToLog);
    },
  };
}
