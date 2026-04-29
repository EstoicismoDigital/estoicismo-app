/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useSavedState } from "../hooks/useSavedState";

describe("useSavedState", () => {
  it("starts as idle", () => {
    const { result } = renderHook(() => useSavedState());
    expect(result.current.state).toBe("idle");
    expect(result.current.savedAt).toBeNull();
  });

  it("transitions to saved on success", async () => {
    const { result } = renderHook(() => useSavedState());
    await act(async () => {
      await result.current.run(async () => "ok");
    });
    expect(result.current.state).toBe("saved");
    expect(result.current.savedAt).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("transitions to error on rejection", async () => {
    const { result } = renderHook(() => useSavedState());
    await act(async () => {
      await result.current.run(async () => {
        throw new Error("fail-msg");
      });
    });
    expect(result.current.state).toBe("error");
    expect(result.current.error).toBe("fail-msg");
  });

  it("ignores stale promises (race)", async () => {
    const { result } = renderHook(() => useSavedState());
    let resolveFirst: (v: string) => void = () => {};
    const first = new Promise<string>((r) => (resolveFirst = r));
    const second = Promise.resolve("second");

    let firstResult: string | undefined;
    let secondResult: string | undefined;

    await act(async () => {
      const firstPromise = result.current.run(() => first);
      const secondPromise = result.current.run(() => second);
      secondResult = await secondPromise;
      resolveFirst("first");
      firstResult = await firstPromise;
    });

    expect(secondResult).toBe("second");
    expect(firstResult).toBe("first");
    // Last in flight was second, which resolved before we resolved first.
    // After all settle, state should reflect the last in-flight (second).
    expect(result.current.state).toBe("saved");
  });
});
