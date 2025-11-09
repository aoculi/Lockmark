import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/entrypoints/lib/api";
import { decryptManifest } from "@/entrypoints/lib/manifestUtils";
import { manifestStore } from "@/entrypoints/store/manifest";
import { useUnlock } from "./unlock";

export type PostAuthFlowInput = {
  password: string;
  userId: string;
  vaultId: string;
};

export type PostAuthFlowResponse = {
  success: boolean;
  isFirstUnlock: boolean;
};

/**
 * Handles the unlock and manifest loading after authentication
 * This is shared between login and register flows
 */
export function usePostAuthFlow() {
  const queryClient = useQueryClient();
  const unlockMutation = useUnlock();

  return useMutation<PostAuthFlowResponse, ApiError, PostAuthFlowInput>({
    mutationKey: ["auth", "postAuthFlow"],
    mutationFn: async (input: PostAuthFlowInput) => {
      return await unlockMutation.mutateAsync(input);
    },
    onSuccess: async () => {
      // Load manifest data after successful unlock
      const queryData = queryClient.getQueryData<any>(["vault", "manifest"]);
      if (queryData) {
        const manifest = await decryptManifest(queryData);
        manifestStore.load({
          manifest,
          etag: queryData.etag,
          version: queryData.version,
        });
      } else {
        // Initialize empty manifest for first-time vaults
        manifestStore.load({
          manifest: { version: 0, items: [], tags: [] },
          etag: null as unknown as string,
          version: 0,
        });
        // Note: serverVersion=0 and etag=null indicates first save should create version 1 without If-Match
      }
    },
  });
}
