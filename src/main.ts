import Api from "./api.ts";
import { getMatrix } from "./aggregate.ts";
import * as log from "log";
import * as web from "./web.ts";
import { get as getConfig } from "./config.ts";
import Agent from "./agent.ts";
import { ms } from "https://deno.land/x/ms@v0.1.0/ms.ts";

const CONFIG = {
  apiToken: getConfig("ALLURE_API_TOKEN"),
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

const agent = new Agent(async () => {
  try {
    log.info("Getting matrix");
    const data = await getMatrix(api);
    log.info("Getting matrix complete");
    return data;
  } catch (err) {
    log.error("Getting matrix failed");
    console.error(err);
    throw err;
  }
}, ms("2h"));

await web.run({
  port: CONFIG.port,
  provider: {
    getMatrix: () => agent.get(),
  },
});
