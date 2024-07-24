// Doesn't work with Deno!
// In order to run tests, install vitest globally using some node.js based package manager and then run `vitest`

import { describe, expect, test, vi } from "vitest";
import { useFreshData } from "./util.ts";

describe("useFreshData", () => {
  test("fetches data before first get", async () => {
    let called = false;

    useFreshData(() => {
      called = true;
      return Promise.resolve(null);
    });

    await expect.poll(() => called).toBe(true);
  });

  test("initial call fails, then succeeds", async () => {
    const data = vi.fn().mockRejectedValueOnce("foo").mockResolvedValueOnce(
      "ok",
    );

    const { get } = useFreshData(data);

    expect(() => get()).rejects.toThrow("foo");
    await expect.poll(() => get()).toBe("ok");
  });

  test("initially ok, then fails, then ok", async () => {
    const data = vi.fn().mockResolvedValueOnce(1).mockRejectedValueOnce("foo")
      .mockResolvedValueOnce(2);

    const { get } = useFreshData(data);

    expect(await get()).toBe(1);
    // waitUntil disallows errors
    vi.waitUntil(async () => {
      const value = await get();
      return value === 2;
    });
  });

  test("updates data 5 times in a row", async () => {
    const { get } = useFreshData(
      vi.fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(5),
    );

    expect(await get()).toBe(1);
    expect(await get()).toBe(1);
    expect(await get()).toBe(2);
    expect(await get()).toBe(3);
    expect(await get()).toBe(4);
  });
});
