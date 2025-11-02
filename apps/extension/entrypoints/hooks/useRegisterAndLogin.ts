/**
 * Combined register + login + unlock hook
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "../lib/api";
import { prefetchVaultData } from "../lib/vaultPrefetch";
import { authStore } from "../store/auth";
import { sessionManager } from "../store/session";
import { useLogin } from "./useLogin";
import { usePostAuthFlow } from "./usePostAuthFlow";
import { useRegister } from "./useRegister";

export type RegisterInput = {
  login: string;
  password: string;
};

export function useRegisterAndLogin() {
  const queryClient = useQueryClient();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const postAuthFlow = usePostAuthFlow();

  return useMutation<
    {
      registerData: any;
      loginData: any;
      unlockData: { success: boolean; isFirstUnlock: boolean };
    },
    ApiError,
    RegisterInput
  >({
    mutationKey: ["auth", "registerAndLogin"],
    mutationFn: async (input: RegisterInput) => {
      try {
        // First perform registration
        const registerData = await registerMutation.mutateAsync(input);

        // Then perform login using the useLogin hook
        const loginResponse = await loginMutation.mutateAsync(input);

        // Note: useLogin's onSuccess callback sets session, but we verify it's set
        // and explicitly ensure it's available for subsequent calls
        const verifySession = await sessionManager.getSession();
        if (!verifySession || verifySession.token !== loginResponse.token) {
          // If session wasn't set by onSuccess callback, set it manually
          await sessionManager.setSession({
            token: loginResponse.token,
            userId: loginResponse.user_id,
            expiresAt: loginResponse.expires_at,
          });

          // Also ensure auth store is set (useLogin's onSuccess should handle this, but ensure it)
          authStore.setKdf(loginResponse.kdf);
          authStore.setWrappedMk(loginResponse.wrapped_mk);

          // Verify again after manual set
          const retryVerify = await sessionManager.getSession();
          if (!retryVerify || retryVerify.token !== loginResponse.token) {
            throw new Error("Session not properly set after login");
          }
        }

        // Prefetch vault data (with error handling - might fail for new users)
        try {
          await prefetchVaultData(queryClient);
        } catch (error) {
          // Log but don't fail - prefetch is optional
          console.warn("Failed to prefetch vault data:", error);
        }

        // Then perform unlock and manifest loading
        const unlockData = await postAuthFlow.mutateAsync({
          password: input.password,
          userId: loginResponse.user_id,
          vaultId: loginResponse.user_id,
        });

        return { registerData, loginData: loginResponse, unlockData };
      } catch (error) {
        console.error("Registration and login flow error:", error);
        throw error;
      }
    },
  });
}
