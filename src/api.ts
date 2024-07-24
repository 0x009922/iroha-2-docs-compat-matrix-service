import { getLogger, retry } from "../deps.ts";

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

export interface ApiTestCaseOverview {
  deleted: boolean;
  customFields: ApiTestCaseCustomFieldData[];
  // there are other fields too, ignore
}

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

  /**
   * Returns test results after a specified date, sorted by creation date (desc)
   */
  public getTestResults(params: {
    createdDateAfter: Date;
  }): Promise<ApiTestCaseResult[]> {
    interface Response {
      content: ApiTestCaseResult[];
    }

    const URL = `${this.baseUrl}/api/rs/testresult/__search?` +
      new URLSearchParams({
        projectId: "1",
        rql:
          `not cf["SDK"] is null and createdDate > ${params.createdDateAfter.getTime()}`,
        page: "0",
        size: "999999",
        sort: "created_date,DESC",
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
  }

  public async getTestCaseOverview(
    id: number,
  ): Promise<ApiTestCaseOverview> {
    logger().debug({ msg: "Loading test case custom fields", id });

    const result = await retry(
      () =>
        fetch(`${this.baseUrl}/api/rs/testcase/${id}/overview`, {
          headers: this.commonHeaders(),
        })
          .then((x) => {
            if (x.status !== 200) {
              logger().error({
                msg: "Failed to load test case custom fields",
                id,
                status: x.status,
              });
            }
            return x.text();
          })
          .then((text) => {
            try {
              const json = JSON.parse(text) as ApiTestCaseOverview; // Attempt to parse the text as JSON
              return json;
            } catch (error) {
              logger().error({
                msg: "Invalid JSON response",
                id,
                error: error.message,
              });
              throw error;
            }
          }),
      { maxTry: 3 },
    );

    return result;
  }

  private commonHeaders() {
    return new Headers({
      Authorization: `Api-Token ${this.apiToken}`,
      "Content-Type": "application/json; charset=utf-8",
    });
  }
}
