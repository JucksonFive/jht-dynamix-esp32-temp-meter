import React from "react";
import { useAppContext } from "../../../../contexts/AppContext";
import { TemperatureChart } from "./TemperatureChart";
import { TemperatureHistoryHeader } from "./TemperatureHistoryHeader";

export const TemperatureHistoryPanel: React.FC = () => {
  const { data, range, selectedDeviceIds } = useAppContext();

  const selectedData =
    selectedDeviceIds.length > 0
      ? data.filter((d) => selectedDeviceIds.includes(d.id))
      : [];
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
