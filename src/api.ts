import { getLogger } from "../deps.ts";

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

interface AuthBearer {
  token: string;
  expiresAt: Date;
}

const ContentTypeJson = {
  "Content-Type": "application/json; charset=utf-8",
} as const;

export default class Api {
  #config: Config;
  #bearer: null | AuthBearer = null;

  public constructor(config: Config) {
    this.#config = config;
  }

  private get baseUrl(): string {
    return this.#config.baseUrl;
  }

  private async bearerAuthorization(): Promise<{
    Authorization: `Bearer ${string}`;
  }> {
    if (!this.#bearer || this.#bearer.expiresAt < new Date()) {
      logger().info(`Acquiring a new bearer token`);
      const formData = new FormData();
      formData.append("grant_type", "apitoken");
      formData.append("scope", "openid");
      formData.append("token", this.#config.apiToken);
      const response: { access_token: string; expires_in: number } =
        await fetch(
          `${this.baseUrl}/api/uaa/oauth/token`,
          {
            method: "POST",
            body: formData,
          },
        )
          .then((x) => x.json());

      logger().info({
        msg: "Got a new bearer token",
        expires: response.expires_in,
      });
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + response.expires_in);
      this.#bearer = { token: response.access_token, expiresAt };
    }
    return { Authorization: `Bearer ${this.#bearer.token}` };
  }

  /**
   * Returns test results after a specified date, sorted by creation date (desc)
   */
  public async getTestResults(params: {
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
      headers: new Headers({
        ...await this.bearerAuthorization(),
        ...ContentTypeJson,
      }),
    })
      .then((x) => x.json() as Promise<Response>)
      .then((x) => x.content)
      .then((result) => {
        logger().debug({ msg: "Found test cases", result });
        return result;
      });
  }

  public async getTestCaseOverview(id: number): Promise<ApiTestCaseOverview> {
    logger().debug({ msg: "Loading test case custom fields", id });

    const result = await fetch(
      `${this.baseUrl}/api/rs/testcase/${id}/overview`,
      {
        headers: new Headers({
          ...await this.bearerAuthorization(),
          ...ContentTypeJson,
        }),
      },
    )
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
      });

    return result;
  }
}
