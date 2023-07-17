import Api from "./api.ts";
import { getMatrix } from "./aggregate.ts";
import * as log from "log";
import * as web from "./web.ts";
import { get as getConfig } from "./config.ts";

const CONFIG = {
  apiToken: getConfig("API_TOKEN"),
  allureBaseUrl: getConfig("ALLURE_BASE_URL"),
  logLevel: getConfig("LOG_LEVEL", "INFO"),
  port: Number(getConfig("PORT", "8080")),
};

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: `{datetime} [{loggerName}] {levelName} {msg}`,
    }),
  },
  loggers: {
    web: {
      level: CONFIG.logLevel,
      handlers: ["console"],
    },
    api: {
      level: CONFIG.logLevel,
      handlers: ["console"],
    },
    aggregate: {
      level: CONFIG.logLevel,
      handlers: ["console"],
    },
    default: {
      level: CONFIG.logLevel,
      handlers: ["console"],
    },
  },
});

const api = new Api({
  apiToken: CONFIG.apiToken,
  baseUrl: CONFIG.allureBaseUrl,
});

await web.run({
  port: CONFIG.port,
  provider: {
    getMatrix: () => getMatrix(api),
  },
});
