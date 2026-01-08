import { render, screen } from "@testing-library/react";
import { DeviceInfo } from "src/pages/Dashboard/Components/Buttons/DeviceInfo";

vi.mock("i18next", async () => ({
  t: (k: string) => k,
}));

vi.mock("../../../../utils/dateFormatter", async () => ({
  formatDateTime: (s: string) => `fmt(${s})`,
}));

describe("pages/Dashboard/Components/Buttons/DeviceInfo.tsx", () => {
  it("shows device id", () => {
    render(<DeviceInfo id="dev-1" updatedAt={""} />);
    expect(screen.getByText("dev-1")).toBeInTheDocument();
  });

  it("shows updatedAt when provided", () => {
    render(<DeviceInfo id="dev-1" updatedAt="2025-12-24T00:00:00Z" />);
    expect(screen.getByText(/lastSeen:/)).toBeInTheDocument();
    expect(screen.getByText(/fmt\(2025-12-24T00:00:00Z\)/)).toBeInTheDocument();
  });
});
