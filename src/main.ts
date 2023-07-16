import Api from "./api.ts";
import { getMatrix } from "./matrix.ts";

const API_TOKEN = "56e84836-8ac5-426b-8e3f-a9059a494dea";

const BASE_URL = "https://soramitsu.testops.cloud";

const api = new Api({
  apiToken: API_TOKEN,
  baseUrl: BASE_URL,
});

const matrix = await getMatrix(api);

console.log(matrix);
