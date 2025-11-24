import { Nullable } from "../utils/types";

export type Reading = {
  deviceId: string;
  timestamp: string;
  temperature: number;
  userId: string;
};

export type ReadingsResponse = {
  items: Reading[];
  nextKey?: Nullable<string>;
};

export interface Device {
  deviceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
