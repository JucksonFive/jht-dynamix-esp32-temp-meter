import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceThresholdPanel from "./DeviceThresholdPanel";

const updateDeviceThreshold = vi.fn();
const updateDevice = vi.fn();
const ctx = {
  devices: [
    {
      deviceId: "dev-1",
      userId: "u",
      createdAt: "c",
      updatedAt: "u",
      temperatureThreshold: 25,
    },
  ],
  selectedDeviceIds: ["dev-1"],
  latestTemperatures: new Map([["dev-1", 28]]),
  updateDevice,
};

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("../../../../contexts/AppContext", async () => ({
  useAppContext: () => ctx,
}));

vi.mock("../../../../services/api", async () => ({
  updateDeviceThreshold: (...args: any[]) => updateDeviceThreshold(...args),
}));

describe("pages/Dashboard/Components/TemperatureChart/DeviceThresholdPanel.tsx", () => {
  beforeEach(() => {
    updateDevice.mockClear();
    updateDeviceThreshold.mockClear();
  });

  it("renders current temperature and threshold exceeded state", () => {
    render(<DeviceThresholdPanel />);
    expect(screen.getByText(/currentTemperature/i)).toBeInTheDocument();
    expect(screen.getByText("thresholdExceeded")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("thresholdPlaceholder");
    expect(input).toHaveValue("25");
  });

  it("saves updated threshold", async () => {
    updateDeviceThreshold.mockResolvedValueOnce({
      deviceId: "dev-1",
      temperatureThreshold: 30,
    });

    const user = userEvent.setup();
    render(<DeviceThresholdPanel />);

    const input = screen.getByPlaceholderText("thresholdPlaceholder");
    await user.clear(input);
    await user.type(input, "30");
    await user.click(screen.getByRole("button", { name: "thresholdSave" }));

    await waitFor(() => {
      expect(updateDeviceThreshold).toHaveBeenCalledWith("dev-1", 30);
      expect(updateDevice).toHaveBeenCalledWith("dev-1", {
        temperatureThreshold: 30,
      });
    });
  });
});
