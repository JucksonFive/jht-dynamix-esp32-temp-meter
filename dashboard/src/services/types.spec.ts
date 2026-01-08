import type { Device, Reading, ReadingsResponse } from "src/services/types";

describe("services/types.ts", () => {
  it("defines expected type shapes", () => {
    expectTypeOf<Device>().toHaveProperty("deviceId");
    expectTypeOf<Device["status"]>().toEqualTypeOf<
      "online" | "offline" | undefined
    >();
    expectTypeOf<Reading>().toHaveProperty("temperature");
    expectTypeOf<ReadingsResponse>().toHaveProperty("items");
  });
});
