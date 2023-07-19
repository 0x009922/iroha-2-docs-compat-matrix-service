import { dotenvLoad } from "../deps.ts";

await dotenvLoad();

export function get(env: string, fallback?: string): string {
  const value = Deno.env.get(env) ?? fallback;
  if (!value) {
    throw new Error(`Missing required ENV var: ${env}`);
  }
  return value;
}
