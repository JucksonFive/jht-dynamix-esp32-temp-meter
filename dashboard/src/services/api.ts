import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { Device, ReadingsResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) throw new Error("VITE_API_URL is not defined");

async function apiRequest<T>(opts: {
  method?: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  params?: Record<string, any>;
  data?: any;
  signal?: AbortSignal;
}): Promise<T> {
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
  nextKey?: string | null;
}): Promise<ReadingsResponse> {
  const query: Record<string, string> = {};
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
  let nextKey: string | null | undefined = undefined;
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
  min: string | null;
  max: string | null;
}> {
  return apiRequest<{ min: string | null; max: string | null }>({
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
