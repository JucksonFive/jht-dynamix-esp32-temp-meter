import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { Device, ReadingsResponse } from "./types";
import { Nullable, QueryParams } from "../utils/types";
import {
  resolveBaseApiUrl,
  getRuntimeConfig,
  setRuntimeConfig,
} from "../utils/runtimeConfig";

async function apiRequest<T>(opts: {
  method?: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  params?: QueryParams;
  data?: unknown;
  signal?: AbortSignal;
}): Promise<T> {
  const BASE_URL = resolveBaseApiUrl();
  if (!BASE_URL) throw new Error("BASE API URL is not defined");
  const session = await fetchAuthSession();
  const token =
    session.tokens?.idToken?.toString() ??
    session.tokens?.accessToken?.toString();
  if (!token) throw new Error("Auth token not available");

  try {
    const res = await axios.request<T>({
      method: opts.method ?? "GET",
      url: `${BASE_URL}${opts.path}`,
      params: opts.params,
      data: opts.data,
      signal: opts.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err: any) {
    throw err;
  }
}

export async function fetchUserReadings(params?: {
  from?: string;
  to?: string;
  deviceIds?: string[];
  limit?: number;
  nextKey?: Nullable<string>;
}): Promise<ReadingsResponse> {
  const query: QueryParams = {};
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;
  if (params?.deviceIds?.length) query.deviceId = params.deviceIds.join(",");
  if (params?.limit) query.limit = String(params.limit);
  if (params?.nextKey) query.nextKey = params.nextKey;

  return apiRequest<ReadingsResponse>({
    path: "/user-readings",
    params: query,
  });
}

export async function fetchAllUserReadings(opts?: {
  from?: string;
  to?: string;
  deviceIds?: string[];
  pageSize?: number;
}) {
  let nextKey: ReadingsResponse["nextKey"] = null;
  const items: ReadingsResponse["items"] = [];
  do {
    const page = await fetchUserReadings({
      from: opts?.from,
      to: opts?.to,
      deviceIds: opts?.deviceIds,
      limit: opts?.pageSize ?? 500,
      nextKey,
    });
    items.push(...(page.items ?? []));
    nextKey = page.nextKey ?? null;
  } while (nextKey);
  return items;
}

export async function fetchReadingBounds(): Promise<{
  min: Nullable<string>;
  max: Nullable<string>;
}> {
  return apiRequest<{ min: Nullable<string>; max: Nullable<string> }>({
    path: "/bounds",
  });
}

export async function fetchUserDevices(opts?: {
  signal?: AbortSignal;
}): Promise<Device[]> {
  return apiRequest<Device[]>({
    path: "/devices",
    signal: opts?.signal,
  });
}

export async function deleteUserDevice(
  deviceId: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>({
    method: "DELETE",
    path: "/delete-user-device",
    params: { deviceId },
  });
}

export async function fetchDashboardConfig(): Promise<Record<string, string>> {
  const url = resolveBaseApiUrl();
  if (!url) throw new Error("BASE API URL is not defined");
  const res = await fetch(`${url}/config`);
  if (!res.ok) throw new Error("Failed to fetch config");
  const json = await res.json();
  setRuntimeConfig(json);
  return json;
}

export const getLatestReadingPerDevice = (
  readings: ReadingsResponse["items"]
): Map<string, string> => {
  const latest = new Map<string, string>();
  readings.forEach((reading) => {
    const current = latest.get(reading.deviceId);
    if (!current || reading.timestamp > current) {
      latest.set(reading.deviceId, reading.timestamp);
    }
  });
  return latest;
};
