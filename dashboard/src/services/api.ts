import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { ReadingsResponse } from "./types";

const BASE_URL = "https://feqbwshm63.execute-api.eu-north-1.amazonaws.com/prod";

export async function fetchUserReadings(params?: {
  from?: string;
  to?: string;
  deviceIds?: string[];
  limit?: number;
  nextKey?: string | null;
}): Promise<ReadingsResponse> {
  const session = await fetchAuthSession();
  const token =
    session.tokens?.idToken?.toString() ??
    session.tokens?.accessToken?.toString();

  const query: Record<string, string> = {};
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;
  if (params?.deviceIds?.length) query.deviceId = params.deviceIds.join(",");
  if (params?.limit) query.limit = String(params.limit);
  if (params?.nextKey) query.nextKey = params.nextKey;

  const res = await axios.get<ReadingsResponse>(`${BASE_URL}/user-readings`, {
    headers: { Authorization: `Bearer ${token}` },
    params: query,
  });
  return res.data;
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
  const session = await fetchAuthSession();
  const token =
    session.tokens?.idToken?.toString() ??
    session.tokens?.accessToken?.toString();

  const res = await axios.get(`${BASE_URL}/bounds`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  return res.data;
}
