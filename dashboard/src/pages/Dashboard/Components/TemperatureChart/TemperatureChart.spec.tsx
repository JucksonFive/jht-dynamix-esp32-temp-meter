import { render, screen } from "@testing-library/react";

import { TemperatureChart } from "src/pages/Dashboard/Components/TemperatureChart/TemperatureChart";

vi.mock("src/contexts/ThemeContext", async () => ({
  useTheme: () => ({
    mode: "dark",
    resolved: "dark",
    setMode: vi.fn(),
    toggle: vi.fn(),
  }),
}));

const bucketizeMulti = vi.fn();
vi.mock("../../../../utils/utils", async () => ({
  bucketizeMulti: (...args: any[]) => bucketizeMulti(...args),
}));
vi.mock("../../../../utils/dateFormatter", async () => ({
  fmtTime: () => "tick",
}));

let xAxisDomain: any;
vi.mock("recharts", async () => {
  const Wrap = ({ children }: any) => <div>{children}</div>;
  return {
    ResponsiveContainer: Wrap,
    LineChart: Wrap,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    YAxis: () => null,
    Line: () => null,
    XAxis: (props: any) => {
      xAxisDomain = props.domain;
      return <div data-testid="xaxis" />;
    },
  };
});

describe("pages/Dashboard/Components/TemperatureChart/TemperatureChart.tsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    xAxisDomain = undefined;
  });

  it("uses data domain when data span is small relative to selected range", () => {
    bucketizeMulti.mockReturnValueOnce({
      deviceIds: ["a"],
      rows: [
        { ts: new Date(0), a: 1 },
        { ts: new Date(3600_000), a: 2 },
      ],
    });

    render(
      <TemperatureChart
        data={[]}
        range={{
          from: new Date(0).toISOString(),
          to: new Date(10 * 3600_000).toISOString(),
        }}
      />,
    );

    expect(screen.getByTestId("xaxis")).toBeInTheDocument();
    expect(xAxisDomain).toEqual([0, 3600_000]);
  });

  it("uses range domain when data span is large", () => {
    bucketizeMulti.mockReturnValueOnce({
      deviceIds: ["a"],
      rows: [
        { ts: new Date(0), a: 1 },
        { ts: new Date(8 * 3600_000), a: 2 },
      ],
    });

    render(
      <TemperatureChart
        data={[]}
        range={{
          from: new Date(0).toISOString(),
          to: new Date(10 * 3600_000).toISOString(),
        }}
      />,
    );

    expect(xAxisDomain).toEqual([0, 10 * 3600_000]);
  });
});
