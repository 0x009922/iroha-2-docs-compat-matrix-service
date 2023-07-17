import "https://deno.land/std@0.194.0/dotenv/load.ts";
import { MissingEnvVarsError} from "https://deno.land/std@0.194.0/dotenv/mod.ts";


export function get(env: string, fallback?: string): string {
  const value = Deno.env.get(env) ?? fallback;
  if (!value) {
    throw new MissingEnvVarsError(`Missing required env vars:`, [env])
  }
  return value;
}
