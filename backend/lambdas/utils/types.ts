import { BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";

export type HandlerEvent = {
  deviceId: string;
  temperature: number;
  humidity: number;
  timestamp: string;
  userId: string;
};
// --- Types ---
export type DeviceDeleteMsg = { userId: string; deviceId: string };
export type ReadingKey = { userId: string; timestamp: string | number };
export type Item = Record<string, unknown>;
export type WriteReqMap = NonNullable<BatchWriteCommandInput["RequestItems"]>;
