"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function useApi() {
  const { getToken } = useAuth();

  // 1. Memoize the core request engine so it maintains referential equality
  const request = useCallback(
    async <TResponse>(endpoint: string, options: RequestInit = {}): Promise<TResponse> => {
      const isExternal = endpoint.startsWith("http");
      const url = isExternal
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

      const headers = new Headers(options.headers);

      if (!isExternal) {
        const token = await getToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);
      }

      if (typeof options.body === "string" && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || response.statusText;
        throw new ApiError(response.status, errorMessage);
      }

      if (response.status === 204) return {} as TResponse;
      return response.json();
    },
    [getToken] // Only rebuild this function if the Clerk Auth state changes
  );

  // 2. Memoize the returned API object so consumers don't trigger infinite loops
  return useMemo(
    () => ({
      get: <TResponse>(endpoint: string, options?: RequestInit) =>
        request<TResponse>(endpoint, { ...options, method: "GET" }),

      post: <TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: RequestInit) =>
        request<TResponse>(endpoint, {
          ...options,
          method: "POST",
          body: body ? JSON.stringify(body) : undefined,
        }),

      put: <TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: RequestInit) =>
        request<TResponse>(endpoint, {
          ...options,
          method: "PUT",
          body: body ? JSON.stringify(body) : undefined,
        }),

      delete: <TResponse>(endpoint: string, options?: RequestInit) =>
        request<TResponse>(endpoint, { ...options, method: "DELETE" }),

      raw: async (endpoint: string, options?: RequestInit): Promise<Response> => {
        const isExternal = endpoint.startsWith("http");
        const url = isExternal ? endpoint : `${API_BASE_URL}${endpoint}`;

        const headers = new Headers(options?.headers);
        if (!isExternal) {
          const token = await getToken();
          if (token) headers.set("Authorization", `Bearer ${token}`);
        }

        const res = await fetch(url, { ...options, headers });
        if (!res.ok) throw new Error(`Raw request failed: ${res.statusText}`);
        return res;
      },
    }),
    [request, getToken]
  );
}
