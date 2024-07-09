import Api, {
  ApiTestCaseCustomFieldData,
  ApiTestCaseResult,
  ApiTestCaseResultStatus,
} from "./api.ts";
import { getLogger, sortBy } from "../deps.ts";

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

type StoriesMap = Map<string, Map<string, Array<ApiTestCaseResultStatus>>>;

export async function getMatrix(api: Api): Promise<Matrix> {
  const createdDateAfter = new Date();
  createdDateAfter.setFullYear(createdDateAfter.getFullYear() - 1);
  const allResults = await api.getTestResults({ createdDateAfter });
  const results = pickResults(allResults);
  const meta: Map<number, TestCaseMeta> = await getTestCaseData(
    api,
    [...results.values()].map((x) => x.testCaseId),
  );
  const stories: Map<string, Map<string, Array<ApiTestCaseResultStatus>>> =
    aggregateStories(results, meta);
  const sdksSet: Set<string> = [...stories.values()].reduce(
    (acc, sdkMap) => {
      for (const sdk of sdkMap.keys()) {
        acc.add(sdk);
      }
      return acc;
    },
    new Set<string>(),
  );
  const sdks = [...sdksSet];
  const storiesMatrix = buildStoriesMatrix(stories, sdks);
  const storiesMatrixSorted = sortBy(storiesMatrix, (x) => x.name);
  const sdksWithName = sdks.map((x) => ({ name: x }));

  return {
    included_sdks: sdksWithName,
    stories: storiesMatrixSorted,
  };
}

async function getTestCaseData(
  api: Api,
  testCaseIdList: number[],
): Promise<MetaMap> {
  const entries = await Promise.all(
    testCaseIdList.map(async (id): Promise<[number, TestCaseMeta][]> => {
		await delay(50000);
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
  ).then((x) => x.flat());

  return new Map(entries);
}

/**
 * @returns a map from custom field name to its id, name and value
 */
function customFieldsToMap(
  input: ApiTestCaseCustomFieldData[],
): Map<string, CustomFieldData> {
  if (!input) {
    logger().warning({
          msg: `Missing test!`
        })
    return new Map(null);
  } else {
  const entries = input
    .map((x) => ({
      id: x.customField.id,
      name: x.customField.name,
      value: x.name,
    }))
    .map((x): [string, CustomFieldData] => [x.name, x]);
    return new Map(entries);
}

}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function aggregateStories(
  results: ResultsMap,
  meta: MetaMap,
): StoriesMap {
  return [...meta.entries()].reduce<StoriesMap>(
    (acc, [test_case_id, { story, sdk }]) => {
      const result = results.get(test_case_id);
      if (!result) {
        console.error(results, meta);
        throw new Error(`Could not find result for test case ${test_case_id}`);
      }

      // merge
      return mapUpdate(
        acc,
        story,
        () => new Map(),
        (storyMap) =>
          mapUpdate(storyMap, sdk, () => [], (list) => {
            list.push(result.status);
            return list;
          }),
      );
    },
    new Map(),
  );
}

function mapUpdate<K, V>(
  map: Map<K, V>,
  key: K,
  defaultValue: () => V,
  update: (value: V) => V,
): Map<K, V> {
  if (map.has(key)) {
    map.set(key, update(map.get(key)!));
  } else {
    map.set(key, update(defaultValue()));
  }
  return map;
}

function buildStoriesMatrix(
  stories: StoriesMap,
  sdks: string[],
): MatrixStory[] {
  return [...stories.entries()].map(([story, sdkMap]): MatrixStory => {
    const results = sdks
      .map((sdk): MatrixStoryResult["status"] => {
        const statuses = sdkMap.get(sdk);
        if (!statuses) {
          return "no-data";
        }
        return statuses.every((x) => x === "passed") ? "ok" : "failed";
      })
      .map((status) => ({ status }));
    return { name: story, results };
  });
}

/**
 * @param input assumed to be sorted by created date (desc)
 * @returns a map from test case id to test case
 */
function pickResults<T extends ApiTestCaseResult>(
  input: T[],
): Map<number, T> {
  return input
    .reduce(
      (map, item) =>
        map.has(item.testCaseId) ? map : map.set(item.testCaseId, item),
      new Map<number, T>(),
    );
}
