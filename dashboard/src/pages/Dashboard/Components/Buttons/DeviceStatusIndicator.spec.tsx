import { render } from "@testing-library/react";
import DeviceStatusIndicator from "src/pages/Dashboard/Components/Buttons/DeviceStatusIndicator";

describe("pages/Dashboard/Components/Buttons/DeviceStatusIndicator.tsx", () => {
  it("renders green indicator when online", () => {
    const { container } = render(<DeviceStatusIndicator isOnline />);
    expect(container.querySelector(".bg-status-normal")).toBeTruthy();
  });

  it("renders red indicator when offline", () => {
    const { container } = render(<DeviceStatusIndicator isOnline={false} />);
    expect(container.querySelector(".bg-status-hot")).toBeTruthy();
  });
});
