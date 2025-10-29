import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { constructAadManifest } from '../../lib/constants';
import { decryptAEAD, fromBase64 } from '../../lib/crypto';
import type { VaultManifest } from '../../lib/types';
import { apiClient, type ApiError } from '../api';
import { keystoreManager } from '../store';

const QUERY_KEYS = {
    vault: () => ['vault'] as const,
    manifest: () => ['vault', 'manifest'] as const,
};

export type VaultMetadata = {
    vault_id: string;
    version: number;
    bytes_total: number;
    has_manifest: boolean;
    updated_at: number;
};

export type ManifestQueryResponse = {
    manifest: VaultManifest;
    etag: string;
    serverVersion: number;
};

export type ManifestApiResponse = {
    vault_id: string;
    version: number;
    etag: string;
    nonce: string;
    ciphertext: string;
    size?: number;
    updated_at: number;
};

export function useVaultMeta() {
    return useQuery<VaultMetadata>({
        queryKey: QUERY_KEYS.vault(),
        queryFn: async () => {
            const response = await apiClient<VaultMetadata>('/vault');
            return response.data;
        },
        staleTime: 30_000,
    });
}

/**
 * useManifest - Load, decrypt, and keep an in-memory manifest
 *
 * Enabled only if keyStore.isUnlocked() === true
 *
 * C1) QueryFn:
 * - GET /vault/manifest
 * - If 404 → treat as "no manifest yet" (return empty manifest)
 * - Else: decrypt using MAK from keystore
 * - Return { manifest, etag, serverVersion }
 *
 * Cache policy:
 * - staleTime: 0
 * - retry: 0
 * - refetchOnWindowFocus: false
 *
 * 404 handling: produce an empty manifest (version 0 locally)
 */
export function useManifest() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isCheckingUnlock, setIsCheckingUnlock] = useState(true);
    const [aadContext, setAadContext] = useState<{ userId: string; vaultId: string } | null>(null);

    // Check keystore unlock status
    useEffect(() => {
        const checkUnlock = async () => {
            try {
                const unlocked = await keystoreManager.isUnlocked();
                setIsUnlocked(unlocked);

                if (unlocked) {
                    const context = await keystoreManager.getAadContext();
                    if (context) {
                        setAadContext({
                            userId: context.userId,
                            vaultId: context.vaultId
                        });
                    }
                }
            } catch (error) {
                setIsUnlocked(false);
            } finally {
                setIsCheckingUnlock(false);
            }
        };

        checkUnlock();
    }, []);

    return useQuery<ManifestQueryResponse | null>({
        queryKey: QUERY_KEYS.manifest(),
        queryFn: async () => {
            if (!isUnlocked || !aadContext) {
                throw new Error('Keystore is locked');
            }

            try {
                // GET /vault/manifest
                const response = await apiClient<ManifestApiResponse>('/vault/manifest');

                // Decrypt manifest
                const nonce = fromBase64(response.data.nonce);
                const ciphertext = fromBase64(response.data.ciphertext);

                // Get MAK from keystore
                const mak = await keystoreManager.getMAK();

                // Construct AAD for manifest
                const aadManifest = new TextEncoder().encode(
                    constructAadManifest(aadContext.userId, aadContext.vaultId)
                );

                // Decrypt: plaintext = AEAD_DEC(ciphertext, AAD_MANIFEST, nonce, MAK)
                const plaintext = decryptAEAD(ciphertext, nonce, mak, aadManifest);

                // Parse manifest JSON
                const manifestText = new TextDecoder().decode(plaintext);
                const manifest: VaultManifest = JSON.parse(manifestText);

                return {
                    manifest,
                    etag: response.data.etag,
                    serverVersion: response.data.version
                };
            } catch (error) {
                // Handle 404 → treat as "no manifest yet" (return empty manifest)
                const apiError = error as ApiError;
                if (apiError.status === 404) {
                    // 404 handling: produce an empty manifest (version 0 locally)
                    return {
                        manifest: {
                            version_counter: 0,
                            book_index: [],
                            chain_head: '' // Will be set on first save
                        } as VaultManifest,
                        etag: '',
                        serverVersion: 0
                    };
                }
                throw error;
            }
        },
        enabled: !isCheckingUnlock && isUnlocked && aadContext !== null,
        staleTime: 0,
        retry: 0,
        refetchOnWindowFocus: false,
    });
}
