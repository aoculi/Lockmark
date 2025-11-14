/**
 * API client for secure extension
 */

import { QueryClient } from '@tanstack/react-query';
import { keystoreManager } from "@/entrypoints/store/keystore";
import { sessionManager } from "@/entrypoints/store/session";
import { settingsStore } from "@/entrypoints/store/settings";
import type { ManifestApiResponse } from "@/entrypoints/components/hooks/useManifestQuery";
import { constructAadManifest } from "@/entrypoints/lib/constants";
import { decryptAEAD, fromBase64, zeroize } from "@/entrypoints/lib/crypto";
import { whenCryptoReady } from "@/entrypoints/lib/cryptoEnv";
import type { ManifestV1 } from "@/entrypoints/lib/types";

// Simplified API client
export type ApiClientOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

export type ApiSuccess<T = unknown> = {
  data: T;
  status: number;
};

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

async function getApiUrl(): Promise<string> {
  const settings = await settingsStore.getState();
  if (!settings.apiUrl || settings.apiUrl.trim() === "") {
    throw {
      status: -1,
      message:
        "API URL is not configured. Please set the API Base URL in Settings.",
      details:
        "The API URL must be defined in the extension settings before making API calls.",
    } as ApiError;
  }
  return settings.apiUrl.trim();
}

async function buildUrl(path: string): Promise<string> {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const apiUrl = await getApiUrl();
  return `${apiUrl}${path}`;
}

async function getAuthHeader(): Promise<string | undefined> {
  const session = await sessionManager.getSession();
  return session?.token ? `Bearer ${session.token}` : undefined;
}

export async function apiClient<T = unknown>(
  path: string,
  options: ApiClientOptions = {}
): Promise<ApiSuccess<T>> {
  const { method = "GET", headers = {}, body, signal } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...headers,
  };

  // Add auth header if available
  const authHeader = await getAuthHeader();
  if (authHeader) {
    requestHeaders["Authorization"] = authHeader;
  }

  let requestBody: string | undefined;
  if (body !== undefined) {
    requestBody = JSON.stringify(body);
  }

  let response: Response;

  try {
    const url = await buildUrl(path);
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal,
      credentials: "omit",
      mode: "cors",
    });
  } catch (err: any) {
    // If it's already an ApiError (like missing API URL), re-throw it
    if (err?.status === -1 && err?.message?.includes("API URL")) {
      throw err as ApiError;
    }
    throw {
      status: -1,
      message: "Network error",
      details: err?.message,
    } as ApiError;
  }

  let data: any = null;
  const text = await response.text();
  if (text.length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // Handle 401 - clear session, keystore, and notify
  // Global 401 handler clears keys and redirects to /login
  if (response.status === 401) {
    await sessionManager.clearSession();
    await keystoreManager.zeroize();
    sessionManager.notifyListeners();
    throw {
      status: 401,
      message: data?.message || data?.error || "Unauthorized",
      details: data?.details,
    } as ApiError;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.message || data?.error || "Request failed",
      details: data?.details,
    } as ApiError;
  }

  return {
    data: data as T,
    status: response.status,
  };
}

/**
 * Vault prefetch utilities
 */
const QUERY_KEYS = {
    vault: () => ['vault'] as const,
    manifest: () => ['vault', 'manifest'] as const,
};

/**
 * Prefetches vault and manifest data after successful authentication
 * Handles the case where manifest might not exist yet (404)
 */
export async function prefetchVaultData(queryClient: QueryClient) {
    // Prefetch vault data
    await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.vault(),
        queryFn: () => apiClient('/vault').then(r => r.data),
    });

    // Check if manifest exists before prefetching (to avoid 404 for new users)
    const vaultData = queryClient.getQueryData<{ has_manifest?: boolean }>(QUERY_KEYS.vault());
    if (vaultData?.has_manifest) {
        await queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.manifest(),
            queryFn: async () => {
                try {
                    const response = await apiClient('/vault/manifest');
                    return response.data;
                } catch (error: any) {
                    // Handle 404 gracefully - manifest doesn't exist yet
                    if (error?.status === 404) {
                        return null;
                    }
                    throw error;
                }
            },
        });
    }
}

/**
 * Decrypts and parses a manifest from API response
 * Returns the parsed manifest and handles key cleanup
 */
export async function decryptManifest(
  data: ManifestApiResponse
): Promise<ManifestV1> {
  // Ensure crypto environment (libsodium) is initialized
  await whenCryptoReady();

  const mak = await keystoreManager.getMAK();
  const aadContext = await keystoreManager.getAadContext();

  if (!mak || !aadContext) {
    throw new Error("Keys not available for decryption");
  }

  const aadManifest = new TextEncoder().encode(
    constructAadManifest(aadContext.userId, aadContext.vaultId)
  );
  const plaintext = decryptAEAD(
    fromBase64(data.ciphertext),
    fromBase64(data.nonce),
    mak,
    aadManifest
  );
  const manifestText = new TextDecoder().decode(plaintext);

  let manifest: ManifestV1;
  try {
    manifest = JSON.parse(manifestText);
    if (!manifest.items || !Array.isArray(manifest.items)) {
      manifest.items = [];
    }
    if (!manifest.tags || !Array.isArray(manifest.tags)) {
      manifest.tags = [];
    }
    if (!manifest.version) {
      manifest.version = data.version;
    }
  } catch (err) {
    manifest = { version: data.version, items: [], tags: [] };
  }

  zeroize(plaintext);
  return manifest;
}
