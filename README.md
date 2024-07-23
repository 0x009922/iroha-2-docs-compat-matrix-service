# Compatibility Matrix collector

For the
[documentation site of Iroha 2](https://github.com/hyperledger/iroha-2-docs).

## Prepare

Install [Deno](https://deno.land/manual@v1.35.1/getting_started/installation).

## Run

Run:

```bash
deno run src/main.ts
```

With all allowances:

```bash
deno run --allow-read --allow-env --allow-net src/main.ts
```

## Use

Use the following request to get the parsed compatibility matrix (port depends
on the configuration):

```http request
GET http://localhost:8080/compat-matrix
```

## Configuration

Either in ENV or in `.env`:

- **`ALLURE_BASE_URL`**: base URL for Allure API calls
- **`ALLURE_API_TOKEN`**: API token to make Allure API calls
- **`PORT`** (optional, default: `8080`): server port
- **`LOG_LEVEL`** (optional, default: `INFO`): _no comments_

See also: [`.env.example`](./.env.example)

## Docker deployment

The project has [`Dockerfile`](./Dockerfile). Default exposed port is `4000`.

## Update deno.lock

If needed remove deno.lock first

```bash
deno cache --lock=deno.lock deps.ts
```

## Prototyping

There is [`allure_compat_matrix.livemd`](./allure_compat_matrix.livemd) - a [Livebook](https://livebook.dev/) notebook used for prototyping of the data flow. It can be used as a reference and as a tool for further updates. Please refer to the Livebook documentation on how to use it if you want.
