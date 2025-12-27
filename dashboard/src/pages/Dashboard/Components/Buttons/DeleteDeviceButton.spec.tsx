import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDeviceButton } from "./DeleteDeviceButton";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const deleteUserDevice = vi.fn();
vi.mock("../../../../services/api", async () => ({
  deleteUserDevice: (...args: any[]) => deleteUserDevice(...args),
}));

vi.mock("../../../../ui/Elements/Modal/ConfirmDialog", async () => ({
  default: (props: any) =>
    props.open ? (
      <div role="dialog">
        <button onClick={props.onCancel}>cancel</button>
        <button onClick={props.onConfirm} disabled={props.loading}>
          confirm
        </button>
      </div>
    ) : null,
}));

describe("pages/Dashboard/Components/Buttons/DeleteDeviceButton.tsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens confirm dialog and deletes device on confirm", async () => {
    const user = userEvent.setup();
    deleteUserDevice.mockResolvedValueOnce({ message: "ok" });
    const onDeleted = vi.fn();
    render(<DeleteDeviceButton deviceId="d1" onDeleted={onDeleted} />);

    await user.click(screen.getByRole("button", { name: /Delete device d1/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "confirm" }));
    expect(deleteUserDevice).toHaveBeenCalledWith("d1");
    expect(onDeleted).toHaveBeenCalledWith("d1");
  });

  it("stops propagation on open click", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <DeleteDeviceButton deviceId="d1" />
      </div>
    );
    await user.click(screen.getByRole("button", { name: /Delete device d1/i }));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("shows error indicator when deletion fails", async () => {
    const user = userEvent.setup();
    deleteUserDevice.mockRejectedValueOnce(new Error("boom"));

    render(<DeleteDeviceButton deviceId="d1" />);
    await user.click(screen.getByRole("button", { name: /Delete device d1/i }));
    await user.click(screen.getByRole("button", { name: "confirm" }));

    expect(
      await screen.findByRole("img", { name: "boom" })
    ).toBeInTheDocument();
  });
});
