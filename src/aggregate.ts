import Api, {
  ApiTestCaseCustomFieldData,
  ApiTestCaseResult,
  ApiTestCaseResultStatus,
} from "./api.ts";

import { List, Map, Seq, Set } from "immutable";

import { getLogger } from "log";

const logger = () => getLogger("aggregate");

const CUSTOM_FIELD_SDK = "SDK";

const CUSTOM_FIELD_STORY = "Story";

interface CustomFieldData {
  id: number;
  name: string;
  value: string;
}

export interface Matrix {
  included_sdks: MatrixSdkDeclaration[];
  stories: MatrixStory[];
}

export interface MatrixSdkDeclaration {
  name: string;
}

export interface MatrixStory {
  name: string;
  results: MatrixStoryResult[];
}

export interface MatrixStoryResult {
  status: "ok" | "failed" | "no-data";
}

interface TestCaseMeta {
  sdk: string;
  story: string;
}

type ResultsMap = Map<number, ApiTestCaseResult>;

type MetaMap = Map<number, TestCaseMeta>;

type StoriesMap = Map<string, Map<string, List<ApiTestCaseResultStatus>>>;

export async function getMatrix(api: Api): Promise<Matrix> {
  const allResults = await api.getTestResults();
  const results = filterLastResults(allResults);
  const meta: Map<number, TestCaseMeta> = await getTestCaseData(
    api,
    results.valueSeq().map((x) => x.testCaseId).toList(),
  );
  const stories: Map<string, Map<string, List<ApiTestCaseResultStatus>>> =
    aggregateStories(results, meta);
  const sdks: List<string> = stories.valueSeq().reduce(
    (set, sdk_map) => set.union(sdk_map.keySeq()),
    Set<string>(),
  ).toList();
  const storiesMatrix = buildStoriesMatrix(stories, sdks);
  const sdksWithName = sdks.map((x) => ({ name: x })).toArray();

  return {
    included_sdks: sdksWithName,
    stories: storiesMatrix,
  };
}

async function getTestCaseData(
  api: Api,
  testCaseIdList: List<number>,
): Promise<MetaMap> {
  const entries = await Promise.all(
    testCaseIdList.map(async (id): Promise<[number, TestCaseMeta][]> => {
      const custom_fields = await api.getTestCaseCustomFields(id);
      const map = customFieldsToMap(custom_fields);

      if (!map.has(CUSTOM_FIELD_SDK)) {
        logger().warning({
          msg: `Missing "${CUSTOM_FIELD_SDK}" custom field for test case`,
          id,
        });
        return [];
      }
      const sdk = map.get(CUSTOM_FIELD_SDK)!.value;

      if (!map.has(CUSTOM_FIELD_STORY)) {
        logger().warning({
          msg: `Missing "${CUSTOM_FIELD_STORY}" custom field for test case`,
          id,
        });
        return [];
      }
      const story = map.get(CUSTOM_FIELD_STORY)!.value;

      return [[id, {
        sdk,
        story,
      }]];
    }),
  );

  return Map(List(entries).flatMap((x) => x));
}

/**
 * @returns a map from custom field name to its id, name and value
 */
function customFieldsToMap(
  input: ApiTestCaseCustomFieldData[],
): Map<string, CustomFieldData> {
  const entries = Seq(input)
    .map((x) => ({
      id: x.customField.id,
      name: x.customField.name,
      value: x.name,
    }))
    .map((x): [string, CustomFieldData] => [x.name, x])
    .toList();

  return Map(entries);
}

function aggregateStories(
  results: ResultsMap,
  meta: MetaMap,
): StoriesMap {

  return meta.reduce((stories, { story, sdk }, test_case_id) => {
    const result = results.get(test_case_id);
    if (!result) {
      console.error(results.toJS(), meta.toJS());
      throw new Error(`Could not find result for test case ${test_case_id}`);
    }
    return stories.mergeDeep(
      Map([[story, Map([[sdk, List([result.status])]])]]),
    );
  }, Map() as StoriesMap);
}

function buildStoriesMatrix(
  stories: StoriesMap,
  sdks: List<string>,
): MatrixStory[] {
  return stories.entrySeq().map(([story, sdkMap]): MatrixStory => {
    const results = sdks
      .map((sdk): MatrixStoryResult["status"] => {
        const statuses = sdkMap.get(sdk);
        if (!statuses) {
          return "no-data";
        }
        return statuses.every((x) => x === "passed") ? "ok" : "failed";
      })
      .map((status) => ({ status }))
      .toArray();
    return { name: story, results };
  }).toArray();
}

/**
 * @returns a map from test case id to test case
 */
function filterLastResults<T extends ApiTestCaseResult>(
  input: T[],
): Map<number, T> {
  return Seq(input)
    .sortBy((x) => x.id)
    .reverse()
    .reduce((map, item) => {
      return map.has(item.testCaseId) ? map : map.set(item.testCaseId, item);
    }, Map<number, T>());
}
