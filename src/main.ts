import Api from "./api.ts";
import { getMatrix } from "./aggregate.ts";
import * as web from "./web.ts";
import { get as getConfig } from "./config.ts";
import { log, match, P, TTL } from "../deps.ts";

const CONFIG = {
  apiToken: getConfig("ALLURE_API_TOKEN"),
  allureBaseUrl: getConfig("ALLURE_BASE_URL"),
  logLevel: match(getConfig("LOG_LEVEL", "INFO")).with(
    P.when((x): x is log.LevelName => Object.keys(log.LogLevels).includes(x)),
    (x) => x,
  ).otherwise((x) => {
    throw new Error(`Not a valid log level: ${x}`);
  }),
  port: Number(getConfig("PORT", "8080")),
};

const DEFAULT_LOGGER_CONFIG: log.LoggerConfig = {
  level: CONFIG.logLevel,
  handlers: ["console"],
};

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: `{datetime} [{loggerName}] {levelName} {msg}`,
    }),
  },
  loggers: {
    default: DEFAULT_LOGGER_CONFIG,
    web: DEFAULT_LOGGER_CONFIG,
    api: DEFAULT_LOGGER_CONFIG,
    aggregate: DEFAULT_LOGGER_CONFIG,
  },
});

const api = new Api({
  apiToken: CONFIG.apiToken,
  baseUrl: CONFIG.allureBaseUrl,
});

// expire in 5 minutes
const ttl = new TTL<Matrix>(5 * 60_000);

await web.run({
  port: CONFIG.port,
  provider: {
    getMatrix: async () => {
      const existing = ttl.get("data");
      if (existing) return existing;
      log.info("Updating the matrix");
      const fresh = await getMatrix(api);
      ttl.set("data", fresh);
      return fresh;
    },
  },
});
