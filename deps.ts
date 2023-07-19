export { List, Map, Seq, Set } from "https://esm.sh/immutable@4.3.1";
export * as log from "https://deno.land/std@0.194.0/log/mod.ts";
export { getLogger } from "https://deno.land/std@0.194.0/log/mod.ts";
export { ms } from "https://deno.land/x/ms@v0.1.0/ms.ts";
export * as oak from "https://deno.land/x/oak@v12.6.0/mod.ts";
export { default as oakLogger } from "https://deno.land/x/oak_logger@1.0.0/mod.ts";
export { match, P } from "https://esm.sh/ts-pattern@5.0.3";

export async function dotenvLoad() {
  await import("https://deno.land/std@0.194.0/dotenv/load.ts");
}
