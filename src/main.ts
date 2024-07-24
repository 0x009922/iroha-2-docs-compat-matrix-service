import Api from "./api.ts";
import { getMatrix } from "./aggregate.ts";
import * as web from "./web.ts";
import { get as getConfig } from "./config.ts";
import { log, match, P } from "../deps.ts";
import { useFreshData } from "./util.ts";

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

const { get: getMatrixWithCache } = useFreshData(async () => {
  log.info("Getting matrix");
  const data = await getMatrix(api);
  log.info("Matrix is ready");
  return data;
});

await web.run({
  port: CONFIG.port,
  provider: {
    getMatrix: getMatrixWithCache,
  },
});
