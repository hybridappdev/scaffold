import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Screen } from "./screen";

afterEach(() => {
  cleanup();
});

describe("screen", () => {
  it("finds the Publish button", () => {
    render(<Screen />);
    expect(screen.getByRole("button", { name: "Publish" })).toBeTruthy();
  });
});
