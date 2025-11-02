import { Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";

import { keystoreManager } from "@/entrypoints/store/keystore";
import { useBookmarks, useTags } from "../../../hooks/bookmarks";
import { useManifest } from "../../../hooks/vault";
import Bookmarks from "../../Bookmarks";
import Tags from "../../Tags";

import styles from "./styles.module.css";

export default function Vault() {
  const { mutation, store } = useManifest();
  const { bookmarks } = useBookmarks();
  const { tags } = useTags();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [currentTagId, setCurrentTagId] = useState<string | null>("all");

  // Check keystore status on mount
  useEffect(() => {
    const checkKeystoreStatus = async () => {
      try {
        const unlocked = await keystoreManager.isUnlocked();
        setIsUnlocked(unlocked);
      } catch (error) {
        setIsUnlocked(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkKeystoreStatus();
  }, []);

  // Show messages for manifest operations
  useEffect(() => {
    if (mutation.isSuccess) {
      setMessage("Changes saved successfully");
      setTimeout(() => setMessage(null), 3000);
    } else if (mutation.isError) {
      const error = mutation.error as any;
      if (error?.details?.offline) {
        setMessage("Working offline—will retry");
      } else {
        setMessage("Failed to save changes");
        setTimeout(() => setMessage(null), 3000);
      }
    }
  }, [mutation.isSuccess, mutation.isError]);

  const onSelectTag = (id: string) => {
    setCurrentTagId(id);
  };

  // Show loading if still checking, or if unlocked but manifest not loaded yet
  const isManifestLoading = isUnlocked && !store.manifest;

  if (isChecking || isManifestLoading) {
    return (
      <div className={styles.container}>
        <Text>Checking vault status...</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isUnlocked && store.manifest ? (
        <>
          <Tags
            bookmarks={bookmarks}
            currentTagId={currentTagId}
            onSelectTag={onSelectTag}
          />

          <Bookmarks tags={tags} message={message} setMessage={setMessage} />
        </>
      ) : (
        <div>
          <p className={styles.errorMessage}>🔒 Vault Locked</p>
          <p>Your vault is locked. Please login again to unlock it.</p>
          <p>
            This may happen if the extension was restarted or keys were cleared.
          </p>
        </div>
      )}
    </div>
  );
}
