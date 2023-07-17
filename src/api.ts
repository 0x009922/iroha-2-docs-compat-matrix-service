import { getLogger } from "log";

const ENABLE_CACHE = false;

const logger = () => getLogger("api");

export interface Config {
  apiToken: string;
  baseUrl: string;
}

export interface ApiTestCaseResult {
  id: number;
  testCaseId: number;
  name: string;
  status: ApiTestCaseResultStatus;
}

export type ApiTestCaseResultStatus = "passed" | "skipped" | "broken";

export interface ApiTestCaseCustomFieldData {
  id: number;
  name: string;
  customField: {
    id: number;
    name: ApiCustomFieldKind;
    createdDate: number;
    lastModifiedDate: number;
    createdBy: string;
    lastModifiedBy: string;
  };
}

export type ApiCustomFieldKind = "Story" | "Permission" | "SDK Test Id" | "SDK";

export default class Api {
  #config: Config;

  public constructor(config: Config) {
    this.#config = config;
  }

  private get baseUrl(): string {
    return this.#config.baseUrl;
  }

  private get apiToken(): string {
    return this.#config.apiToken;
  }

  public getTestResults(): Promise<ApiTestCaseResult[]> {
    interface Response {
      content: ApiTestCaseResult[];
    }

    return cacheData("cache/test-results.json", () => {
      const URL = `${this.baseUrl}/api/rs/testresult/__search?` +
        new URLSearchParams({
          projectId: "1",
          rql: `not cf["SDK"] is null`,
          page: "0",
          size: "999999",
          sort: "created_date",
        });

      logger().debug({ msg: "Request", URL });

      return fetch(URL, {
        headers: this.commonHeaders(),
      })
        .then((x) => x.json() as Promise<Response>)
        .then((x) => x.content)
        .then((result) => {
          logger().debug({ msg: "Found test cases", result });
          return result;
        });
    });
  }

  public getTestCaseCustomFields(
    id: number,
  ): Promise<ApiTestCaseCustomFieldData[]> {
    return cacheData(`cache/test-case-${id}.json`, () => {
      logger().debug({ msg: "Loading test case custom fields", id });

      return fetch(`${this.baseUrl}/api/rs/testcase/${id}/cfv`, {
        headers: this.commonHeaders(),
      })
        .then((x) => x.json())
        .then((x) => {
          logger().debug({ msg: "Test case custom fields", id, data: x });
          return x;
        });
    });
  }

  private commonHeaders() {
    return new Headers({
      Authorization: `Api-Token ${this.apiToken}`,
      "Content-Type": "application/json; charset=utf-8",
    });
  }
}

async function cacheData<T>(file: string, fn: () => Promise<T>): Promise<T> {
  if (!ENABLE_CACHE) return fn()

  try {
    const content = await Deno.readTextFile(file).then((x) => JSON.parse(x));
    logger().debug({ msg: "Loaded cached", file });
    return content;
  } catch {
    const data = await fn();
    await Deno.writeTextFile(file, JSON.stringify(data));
    logger().debug({ msg: "Written cache", file });
    return data;
  }
}
