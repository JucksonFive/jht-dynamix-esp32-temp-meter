import { render, screen } from "@testing-library/react";

import { TemperatureHistoryHeader } from "src/pages/Dashboard/Components/TemperatureChart/TemperatureHistoryHeader";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/TemperatureChart/TemperatureHistoryHeader.tsx", () => {
  it("renders default heading and device chips", () => {
    render(<TemperatureHistoryHeader selectedDeviceIds={["a", "b"]} />);
    expect(
      screen.getByRole("heading", { name: "temperatureHistory" })
    ).toBeInTheDocument();
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
  });

  it("supports custom title", () => {
    render(<TemperatureHistoryHeader selectedDeviceIds={[]} title="X" />);
    expect(screen.getByRole("heading", { name: "X" })).toBeInTheDocument();
  });
});
