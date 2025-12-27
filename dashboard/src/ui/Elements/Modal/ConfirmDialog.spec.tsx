import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ui/Elements/Modal/ConfirmDialog.tsx", () => {
  const baseProps = {
    open: true,
    title: "Delete device?",
    description: "This cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when open=false", () => {
    render(<ConfirmDialog {...baseProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title/description and correct aria attributes when open", () => {
    render(<ConfirmDialog {...baseProps} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "confirm-dialog-title");

    expect(screen.getByText(baseProps.title)).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: baseProps.cancelLabel })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: baseProps.confirmLabel })).toBeInTheDocument();
  });

  it("calls onCancel when clicking the overlay (but not when clicking the panel)", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...baseProps} />);

    const dialog = screen.getByRole("dialog");
    await user.click(dialog);
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);

    baseProps.onCancel.mockClear();
    await user.click(screen.getByText(baseProps.title));
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel on Escape when not loading", () => {
    render(<ConfirmDialog {...baseProps} loading={false} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel on Escape when loading", () => {
    render(<ConfirmDialog {...baseProps} loading />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...baseProps} />);

    await user.click(screen.getByRole("button", { name: baseProps.confirmLabel }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and shows loading label when loading", () => {
    render(<ConfirmDialog {...baseProps} loading />);

    expect(screen.getByRole("button", { name: baseProps.cancelLabel })).toBeDisabled();
    expect(screen.getByRole("button", { name: "..." })).toBeDisabled();
  });

  it("focuses the cancel button on open", async () => {
    vi.useFakeTimers();
    render(<ConfirmDialog {...baseProps} />);

    vi.runAllTimers();

    const cancel = screen.getByRole("button", { name: baseProps.cancelLabel });
    expect(cancel).toHaveFocus();

    vi.useRealTimers();
  });
});
