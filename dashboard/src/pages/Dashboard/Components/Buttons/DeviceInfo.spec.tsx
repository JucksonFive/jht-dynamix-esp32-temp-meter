import { render, screen } from "@testing-library/react";
import { DeviceInfo } from "./DeviceInfo";

vi.mock("i18next", async () => ({
  t: (k: string) => k,
}));

vi.mock("../../../../utils/dateFormatter", async () => ({
  formatDateTime: (s: string) => `fmt(${s})`,
}));

describe("pages/Dashboard/Components/Buttons/DeviceInfo.tsx", () => {
  it("shows device id", () => {
    render(<DeviceInfo id="dev-1" />);
    expect(screen.getByText("dev-1")).toBeInTheDocument();
  });

  it("shows lastSeen when provided", () => {
    render(<DeviceInfo id="dev-1" lastSeen="2025-12-24T00:00:00Z" />);
    expect(screen.getByText(/lastSeen:/)).toBeInTheDocument();
    expect(screen.getByText(/fmt\(2025-12-24T00:00:00Z\)/)).toBeInTheDocument();
  });
});
