import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IdentityProvider } from "../context/IdentityContext";
import IdentityBadge from "./IdentityBadge";

const identity = {
  color: "#06b6d4",
  id: "identity-1",
  name: "Curious Llama",
};

describe("IdentityBadge", () => {
  it("renames the current identity", async () => {
    window.localStorage.setItem(
      "collab-canvas:identity",
      JSON.stringify(identity),
    );

    render(
      <IdentityProvider>
        <IdentityBadge />
      </IdentityProvider>,
    );

    const nameInput = screen.getByRole("textbox", {
      name: "Your display name",
    });
    fireEvent.change(nameInput, { target: { value: "Ada Lovelace" } });

    expect(nameInput).toHaveValue("Ada Lovelace");

    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem("collab-canvas:identity")!).name,
      ).toBe("Ada Lovelace");
    });
  });
});
