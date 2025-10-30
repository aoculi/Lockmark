/**
 * Combined login + unlock hook
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../lib/api';
import { decryptManifest } from '../lib/manifestUtils';
import { manifestStore } from '../store/manifest';
import { useUnlock } from './unlock';
import { useLogin } from './useLogin';

export type LoginInput = {
    login: string;
    password: string;
};

export function useLoginAndUnlock() {
    const queryClient = useQueryClient();
    const loginMutation = useLogin();
    const unlockMutation = useUnlock();

    return useMutation<{ loginData: any; unlockData: { success: boolean; isFirstUnlock: boolean } }, ApiError, LoginInput>({
        mutationKey: ['auth', 'loginAndUnlock'],
        mutationFn: async (input: LoginInput) => {
            // First perform login
            const loginData = await loginMutation.mutateAsync(input);

            // Then perform unlock
            const unlockData = await unlockMutation.mutateAsync({
                password: input.password,
                userId: loginData.user_id,
                vaultId: loginData.user_id // Using user_id as vault_id for simplicity
            });

            return { loginData, unlockData };
        },
        onSuccess: async (data) => {
            // Prefetch manifest data
            const queryData = queryClient.getQueryData<any>(['vault', 'manifest']);
            if (queryData) {
                const manifest = await decryptManifest(queryData);
                manifestStore.load({ manifest, etag: queryData.etag, version: queryData.version });
            } else {
                // Initialize empty manifest for first-time vaults
                manifestStore.load({
                    manifest: { version: 0, items: [], tags: [] },
                    etag: null as unknown as string, // manifestStore.load requires string, but we track null via serverVersion
                    version: 0,
                });
                // Note: serverVersion=0 and etag=null indicates first save should create version 1 without If-Match
            }
        },
    });
}
