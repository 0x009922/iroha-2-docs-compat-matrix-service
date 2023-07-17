import Api from "./api.ts";
import { getMatrix } from "./aggregate.ts";
import * as log from "log";
import * as web from './web.ts'

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: `{datetime} [{loggerName}] {levelName} {msg}`,
    }),
  },
  loggers: {
    web: {
      level: "DEBUG",
      handlers: ["console"],
    },
    api: {
      level: "DEBUG",
      handlers: ["console"],
    },
    aggregate: {
      level: "DEBUG",
      handlers: ["console"],
    },
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const API_TOKEN = "56e84836-8ac5-426b-8e3f-a9059a494dea";

const BASE_URL = "https://soramitsu.testops.cloud";

const api = new Api({
  apiToken: API_TOKEN,
  baseUrl: BASE_URL,
});

await web.run({
  port: 8080,
  provider: {
    getMatrix: () => getMatrix(api)
  }
})
