import { Nullable } from "src/utils/types";

export type Reading = {
  deviceId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  userId: string;
};

export type ReadingsResponse = {
  items: Reading[];
  nextKey?: Nullable<string>;
};

export interface Device {
  deviceId: string;
  deviceName: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
