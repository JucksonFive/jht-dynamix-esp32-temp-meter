import { render, screen } from "@testing-library/react";

import { TemperatureHistoryPanel } from "src/pages/Dashboard/Components/TemperatureChart/TemperatureHistoryPanel";

const ctx = {
  data: [
    { id: "a", timestamp: "t1", temperature: 1 },
    { id: "b", timestamp: "t2", temperature: 2 },
  ],
  range: { from: "f", to: "t" },
  selectedDeviceIds: ["b"],
};
vi.mock("../../../../contexts/AppContext", async () => ({
  useAppContext: () => ctx,
}));

const chartSpy = vi.fn();
vi.mock("./TemperatureChart", async () => ({
  TemperatureChart: (props: any) => {
    chartSpy(props);
    return <div data-testid="chart" />;
  },
}));
vi.mock("./TemperatureHistoryHeader", async () => ({
  TemperatureHistoryHeader: () => <div data-testid="hdr" />,
}));

describe("pages/Dashboard/Components/TemperatureChart/TemperatureHistoryPanel.tsx", () => {
  it("passes selected device data to chart", () => {
    render(<TemperatureHistoryPanel />);
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(chartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        range: ctx.range,
        data: [{ id: "b", timestamp: "t2", temperature: 2 }],
      })
    );
  });
});
