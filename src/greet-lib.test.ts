import { describe, expect, it } from "vitest";

import { greeting } from "./greet-lib.js";

describe("greeting", () => {
  it("returns the default greeting for zero names", () => {
    expect(greeting([])).toBe("Hello, World!");
  });

  it("greets a single name", () => {
    expect(greeting(["Alice"])).toBe("Hello, Alice!");
  });

  it("joins two names with 'and' and no comma", () => {
    expect(greeting(["Alice", "Bob"])).toBe("Hello, Alice and Bob!");
  });

  it("uses a serial comma for three names", () => {
    expect(greeting(["Alice", "Bob", "Carol"])).toBe(
      "Hello, Alice, Bob, and Carol!",
    );
  });

  it("uses a serial comma for four names", () => {
    expect(greeting(["Alice", "Bob", "Carol", "Dave"])).toBe(
      "Hello, Alice, Bob, Carol, and Dave!",
    );
  });
});
