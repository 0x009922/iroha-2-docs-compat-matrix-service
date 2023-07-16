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

    return fetch(
      `${this.baseUrl}/api/rs/testresult/__search?` +
        new URLSearchParams({
          projectId: "1",
          rql: `not cf["SDK"] is null`,
          page: "0",
          size: "999_999",
          sort: "created_date",
        }),
      {
        headers: this.commonHeaders(),
      },
    )
      .then((x) => x.json() as Promise<Response>)
      .then((x) => x.content);
  }

  public getTestCaseCustomFields(
    id: number,
  ): Promise<ApiTestCaseCustomFieldData[]> {
    return fetch(`${this.baseUrl}/api/rs/testcase/${id}/cfv`, {
      headers: this.commonHeaders(),
    }).then((x) => x.json());
  }

  private commonHeaders() {
    return new Headers({
      Authorization: `Api-Token ${this.apiToken}`,
      "Content-Type": "application/json; charset=utf-8",
    });
  }
}
