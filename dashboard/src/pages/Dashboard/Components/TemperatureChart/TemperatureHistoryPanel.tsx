import React from "react";
import { useAppContext } from "src/contexts/AppContext";
import { TemperatureChart } from "src/pages/Dashboard/Components/TemperatureChart/TemperatureChart";
import { TemperatureHistoryHeader } from "src/pages/Dashboard/Components/TemperatureChart/TemperatureHistoryHeader";

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
