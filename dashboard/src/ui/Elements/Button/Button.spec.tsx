import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "src/ui/Elements/Button/Button";
import { buttonIntents, buttonSizes } from "src/ui/variants";

describe("ui/Elements/Button/Button.tsx", () => {
  it("renders children and forwards button props", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button type="button" onClick={onClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("merges variant classes and custom className", () => {
    render(
      <Button intent="secondary" size="lg" className="my-extra">
        X
      </Button>
    );

    const el = screen.getByRole("button", { name: "X" });
    expect(el).toHaveClass("my-extra");

    const cls = el.getAttribute("class") ?? "";
    expect(cls).toContain(buttonIntents.secondary);
    expect(cls).toContain(buttonSizes.lg);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    );

    const el = screen.getByRole("button", { name: "Disabled" });
    expect(el).toBeDisabled();

    await user.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });
});
