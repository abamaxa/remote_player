import {RestAdaptor} from "./RestAdaptor";

export interface Logger {

  log: (level: string, message: string) => void;
  log_messages: (level: string, messages: string[]) => void;
}

const ERROR = "error";
const WARNING = "warning";
const INFO = "info";

export class ServerLogger implements Logger {

  private readonly host: RestAdaptor;

  constructor(host: RestAdaptor) {
    this.host = host;
  }

  log = (level: string, message: string) => {
    this.log_messages(level, [message]);
  }

  log_messages = (level: string, messages: string[]) => {
    this.host.post('log', {level: level, messages: messages})
      .catch((err) => {
        console.error(err)
      })
  }
}

export let gLogger: Logger | null = null;

export const createLogger = (host: RestAdaptor) => {
  gLogger = new ServerLogger(host);
}

export const log = (level: string, message: any, include_stack?: boolean) => {
  const conLog = include_stack ? console.error : console.log;
  const msg_str: string = makeString(message);

  if (gLogger === null) {
    conLog(`NO LOGGER: ${level} - ${msg_str}`);

  } else {
    conLog(`${level} - ${msg_str}`);

    let args: string[] = [msg_str];

    if (include_stack) {
      const stackTrace = Error().stack;
      if (stackTrace !== undefined) {
        args = [...args, ...stackTrace.split("\n")];
      }
    }

    gLogger.log_messages(level, args);
  }
}

export const log_info = (message: string) => {
  log(INFO, message);
}

export const log_warning = (message: string) => {
  log(WARNING, message);
  alert(message);
}

export const log_error = (message: any) => {
  log(ERROR, message, true);
  alert(message);
}

export const makeString = (message: any): string => {
  if (typeof message === "string") {
    return message as string;
  } else if (message instanceof Error) {
    return message.message;
  }

  return JSON.stringify(message);
}