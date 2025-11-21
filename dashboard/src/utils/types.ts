export type DateStr = string;

export type Range = { from: DateStr; to: DateStr };

export type DeviceData = {
  id: string;
  temperature: number;
  timestamp: string;
};

export type Point = { timestamp: string; temperature: number };

export interface SidePanelDevice {
  id: string;
  lastSeen?: string;
}
