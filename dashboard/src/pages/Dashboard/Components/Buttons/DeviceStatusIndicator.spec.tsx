import { render } from "@testing-library/react";
import DeviceStatusIndicator from "./DeviceStatusIndicator";

describe("pages/Dashboard/Components/Buttons/DeviceStatusIndicator.tsx", () => {
  it("renders green indicator when online", () => {
    const { container } = render(<DeviceStatusIndicator isOnline />);
    expect(container.querySelector(".bg-green-500")).toBeTruthy();
  });

  it("renders red indicator when offline", () => {
    const { container } = render(<DeviceStatusIndicator isOnline={false} />);
    expect(container.querySelector(".bg-red-500")).toBeTruthy();
  });
});
