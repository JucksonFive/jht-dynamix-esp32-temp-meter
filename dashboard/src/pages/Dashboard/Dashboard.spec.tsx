import { render, screen } from "@testing-library/react";
import { Dashboard } from "src/pages/Dashboard/Dashboard";

const useAppContext = vi.fn();
vi.mock("../../contexts/AppContext", async () => ({
  useAppContext: () => useAppContext(),
}));

vi.mock("./Components/HeaderBar", async () => ({
  HeaderBar: () => <div data-testid="hdr" />,
}));
vi.mock("./Components/DateRange/DateRangeFilter", async () => ({
  DateRangeFilter: () => <div data-testid="range" />,
}));
vi.mock("./Components/SidePanel/SidePanel", async () => ({
  SidePanel: () => <div data-testid="side" />,
}));
vi.mock("./Components/TemperatureChart/TemperatureHistoryPanel", async () => ({
  TemperatureHistoryPanel: () => <div data-testid="chart" />,
}));
vi.mock("./Components/SidePanel/SelectDeviceHelp", async () => ({
  SelectDeviceHelp: () => <div data-testid="help" />,
}));

describe("pages/Dashboard/Dashboard.tsx", () => {
  it("shows help when no device selected", () => {
    useAppContext.mockReturnValueOnce({
      selectedDeviceIds: [],
      handleLogout: vi.fn(),
    });
    render(<Dashboard />);
    expect(screen.getByTestId("hdr")).toBeInTheDocument();
    expect(screen.getByTestId("range")).toBeInTheDocument();
    expect(screen.getByTestId("side")).toBeInTheDocument();
    expect(screen.getByTestId("help")).toBeInTheDocument();
  });

  it("shows chart when at least one device selected", () => {
    useAppContext.mockReturnValueOnce({
      selectedDeviceIds: ["a"],
      handleLogout: vi.fn(),
    });
    render(<Dashboard />);
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(screen.queryByTestId("help")).not.toBeInTheDocument();
  });
});
