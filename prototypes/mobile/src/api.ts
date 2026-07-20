import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ApiEnvelope } from "../../../packages/api-contracts/src";

const apiBaseUrl = process.env.EXPO_PUBLIC_ILSP_API_BASE_URL;

export async function readWithCache<T>(path: string, cacheKey: string): Promise<T> {
  let networkError: Error | null = null;
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}${path}`);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const payload = await response.json() as ApiEnvelope<T>;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(payload.data));
      return payload.data;
    } catch (reason: unknown) {
      networkError = reason instanceof Error ? reason : new Error("Service unavailable");
    }
  }

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached) as T;
  throw networkError ?? new Error("Set EXPO_PUBLIC_ILSP_API_BASE_URL to the local ILSP web address.");
}

export function mediaUrl(src: string) {
  return apiBaseUrl && src.startsWith("/") ? `${apiBaseUrl}${src}` : src;
}
