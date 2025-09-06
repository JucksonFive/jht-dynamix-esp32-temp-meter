import { BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";

export type HandlerEvent = {
  deviceId: string;
  temperature: number;
  timestamp: string;
  userId?: string;
};
// --- Types ---
export type DeviceDeleteMsg = { userId: string; deviceId: string };
// Perusavaimet Temperatures-tauluun (säädä jos sinun skeema poikkeaa)
export type ReadingKey = { userId: string; timestamp: string | number };
export type Item = { [k: string]: any };
// BatchWrite helper: anna sisään _varmasti_ olemassa oleva RequestItems
export type WriteReqMap = NonNullable<BatchWriteCommandInput["RequestItems"]>;
