/**
 * Vault screen - Main container component
 * Coordinates child components and manages high-level state
 */
import { keystoreManager } from "@/entrypoints/store/keystore";
import { manifestStore } from "@/entrypoints/store/manifest";
import { useEffect, useState } from "react";
import { useBookmarks, useTags } from "../../../hooks/bookmarks";
import { useManifest } from "../../../hooks/vault";
import type { Bookmark } from "../../../lib/types";
import { BookmarkEditModal } from "../../BookmarkEditModal";
import { BookmarkList } from "../../BookmarkList";
import { MessageBanner } from "../../MessageBanner";
import { Toolbar } from "../../Toolbar";
import { VaultHeader } from "../../VaultHeader";

import { Text } from "@radix-ui/themes";
import Tags from "../../Tags";
import styles from "./styles.module.css";

export default function Vault() {
  const { mutation, store } = useManifest();
  const { bookmarks, addBookmark, updateBookmark, deleteBookmark } =
    useBookmarks();
  const { tags, createTag, renameTag, deleteTag } = useTags();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [isManagingTags, setIsManagingTags] = useState(false);

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

  const handleSave = async () => {
    if (!(store.status === "dirty" || store.status === "offline")) return;
    if (mutation.isPending) return;
    try {
      const saveData = manifestStore.getSaveData();
      if (saveData) {
        // mark saving to prevent debounce-triggered autosave overlap
        manifestStore.setSaving();
        await mutation.mutateAsync(saveData);
      }
    } catch (error) {
      // handled in useEffect
    }
  };

  const handleRetry = () => {
    handleSave();
  };

  const handleAddBookmark = () => {
    setIsAddingBookmark(true);
    setEditingBookmark(null);
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsAddingBookmark(false);
  };

  const handleSaveBookmark = (data: {
    url: string;
    title: string;
    notes?: string;
    tags: string[];
  }) => {
    try {
      if (editingBookmark) {
        updateBookmark(editingBookmark.id, data);
      } else {
        addBookmark(data);
      }
      setEditingBookmark(null);
      setIsAddingBookmark(false);
    } catch (error) {
      // Show validation error
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save bookmark";
      setMessage(errorMessage);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditingBookmark(null);
    setIsAddingBookmark(false);
  };

  const handleDeleteBookmark = (id: string) => {
    if (confirm("Are you sure you want to delete this bookmark?")) {
      try {
        deleteBookmark(id);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete bookmark";
        setMessage(errorMessage);
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  if (isChecking) {
    return (
      <div className={styles.container}>
        <Text>Checking vault status...</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Tags />
      </div>
      <div className={styles.right}>
        <VaultHeader onSave={handleSave} />
        <MessageBanner message={message} onRetry={handleRetry} />
        <div className={styles.card}>
          {isUnlocked ? (
            <>
              {store.manifest && (
                <>
                  <Toolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onAddBookmark={handleAddBookmark}
                    isManagingTags={isManagingTags}
                    onToggleTagManager={() =>
                      setIsManagingTags(!isManagingTags)
                    }
                  />

                  <BookmarkList
                    bookmarks={bookmarks}
                    tags={tags}
                    searchQuery={searchQuery}
                    onEdit={handleEditBookmark}
                    onDelete={handleDeleteBookmark}
                  />

                  {(isAddingBookmark || editingBookmark) && (
                    <BookmarkEditModal
                      bookmark={editingBookmark}
                      tags={tags}
                      onSave={handleSaveBookmark}
                      onCancel={handleCancelEdit}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <p className={styles.errorMessage}>🔒 Vault Locked</p>
              <p>Your vault is locked. Please login again to unlock it.</p>
              <p>
                This may happen if the extension was restarted or keys were
                cleared.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
