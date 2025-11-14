/**
 * Chrome Storage and Settings utilities
 */

import {
  DEFAULT_AUTO_LOCK_TIMEOUT,
  DEFAULT_AUTO_LOCK_TIMEOUT_MS,
  STORAGE_KEYS,
} from "./constants";

/**
 * Settings interface
 */
export interface Settings {
  showHiddenTags: boolean;
  apiUrl: string;
  autoLockTimeout: string;
}

/**
 * Get value from chrome.storage.local
 */
export function getStorageItem<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    if (!chrome.storage?.local) {
      console.log("chrome.storage.local is not available");
      resolve(null);
      return;
    }

    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        console.log("chrome.runtime.lastError", chrome.runtime.lastError);
        resolve(null);
        return;
      }
      resolve(result[key] || null);
    });
  });
}

/**
 * Set value in chrome.storage.local
 */
export function setStorageItem(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.local) {
      reject(new Error("chrome.storage.local is not available"));
      return;
    }

    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || "Unknown error"));
        return;
      }
      resolve();
    });
  });
}

/**
 * Get settings from chrome.storage.local
 */
export function getSettings(): Promise<Settings | null> {
  return getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);
}

/**
 * Set settings in chrome.storage.local
 */
export function setSettings(settings: Settings): Promise<void> {
  return setStorageItem(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Get default settings object
 */
export function getDefaultSettings(): Settings {
  return {
    showHiddenTags: false,
    apiUrl: "",
    autoLockTimeout: DEFAULT_AUTO_LOCK_TIMEOUT,
  };
}

/**
 * Parse auto-lock timeout string to milliseconds
 */
export function parseAutoLockTimeout(timeout: string): number {
  const match = timeout.match(/^(\d+)(min|h)$/);
  if (!match) {
    return DEFAULT_AUTO_LOCK_TIMEOUT_MS;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === "h") {
    return value * 60 * 60 * 1000;
  } else {
    return value * 60 * 1000;
  }
}

/**
 * Get auto-lock timeout from settings
 */
export async function getAutoLockTimeout(): Promise<number> {
  const settings = (await getSettings()) || getDefaultSettings();
  const timeout = parseAutoLockTimeout(
    settings.autoLockTimeout || DEFAULT_AUTO_LOCK_TIMEOUT,
  );
  return timeout;
}

