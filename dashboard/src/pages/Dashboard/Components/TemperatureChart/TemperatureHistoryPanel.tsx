import React from "react";
import { DeviceData, Range } from "../../../../utils/types";
import { TemperatureChart } from "./TemperatureChart";
import { TemperatureHistoryHeader } from "./TemperatureHistoryHeader";

interface TemperatureHistoryPanelProps {
  selectedData: DeviceData[];
  range: Range;
  selectedDeviceIds: string[];
}

export const TemperatureHistoryPanel: React.FC<
  TemperatureHistoryPanelProps
> = ({ selectedData, range, selectedDeviceIds }) => {
  return (
    <div>
      <TemperatureHistoryHeader selectedDeviceIds={selectedDeviceIds} />
      <TemperatureChart
        data={selectedData.map((d) => ({
          id: d.id,
          timestamp: d.timestamp,
          temperature: d.temperature,
        }))}
        range={range}
      />
    </div>
  );
};

export default TemperatureHistoryPanel;
