import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiError } from '../api';
import { authStore, keystoreManager, sessionManager, type KdfParams } from '../store';
import { useUnlock } from './unlock';

// Query keys
const QUERY_KEYS = {
    session: () => ['auth', 'session'] as const,
    vault: () => ['vault'] as const,
    manifest: () => ['vault', 'manifest'] as const,
};

// Types
export type LoginInput = {
    login: string;
    password: string;
};

export type LoginResponse = {
    user_id: string;
    token: string;
    expires_at: number;
    kdf: KdfParams;
    wrapped_mk: string | null;
};

export type SessionResponse = {
    user_id: string;
    valid: boolean;
    expires_at: number;
};

// Auth hooks
export function useLogin() {
    const queryClient = useQueryClient();
    const unlockMutation = useUnlock();

    return useMutation<LoginResponse, ApiError, LoginInput>({
        mutationKey: ['auth', 'login'],
        mutationFn: async (input: LoginInput) => {
            const response = await apiClient<LoginResponse>('/auth/login', {
                method: 'POST',
                body: input,
            });

            // Security: Never log sensitive data (wrapped_mk, tokens, etc.)
            return response.data;
        },
        onSuccess: async (data) => {
            // Store session in background service worker
            await sessionManager.setSession({
                token: data.token,
                userId: data.user_id,
                expiresAt: data.expires_at,
            });

            // Store sensitive auth data in memory
            authStore.setKdf(data.kdf);
            authStore.setWrappedMk(data.wrapped_mk);

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
        },
    });
}

/**
 * Combined login + unlock hook
 * Performs login and then immediately unlocks the vault
 */
export function useLoginAndUnlock() {
    const queryClient = useQueryClient();
    const loginMutation = useLogin();
    const unlockMutation = useUnlock();

    return useMutation<{ loginData: LoginResponse; unlockData: { success: boolean; isFirstUnlock: boolean } }, ApiError, LoginInput>({
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
            // Prefetch vault data after successful unlock
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
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationKey: ['auth', 'logout'],
        mutationFn: async () => {
            try {
                await apiClient('/auth/logout', { method: 'POST' });
            } catch (err: any) {
                // Ignore 401 errors during logout
                if (err?.status !== 401) {
                    throw err;
                }
            }
        },
        onSettled: async () => {
            // Clear all auth data
            await sessionManager.clearSession();
            authStore.clear();
            // Clear keystore (keys are already zeroized in background.ts)
            await keystoreManager.zeroize();
            queryClient.clear();
        },
    });
}

export function useSession() {
    return useQuery<SessionResponse>({
        queryKey: QUERY_KEYS.session(),
        queryFn: async () => {
            const response = await apiClient<SessionResponse>('/auth/session');
            return response.data;
        },
        enabled: false, // Only run when explicitly called
        staleTime: 0,
    });
}
