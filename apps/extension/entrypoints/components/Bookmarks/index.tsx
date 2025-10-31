import { useState } from "react";

import { useBookmarks } from "@/entrypoints/hooks/useBookmarks";
import { useManifest } from "@/entrypoints/hooks/vault";
import { manifestStore } from "@/entrypoints/store/manifest";
import type { Bookmark, Tag } from "../../lib/types";
import BookmarkHeader from "./BookmarkHeader";
import { BookmarkList } from "./BookmarkList";
import { BookmarkModal } from "./BookmarkModal";
import { MessageBanner } from "./MessageBanner";

import styles from "./styles.module.css";

export default function Bookmarks({
  message,
  setMessage,
  tags,
}: {
  message: string | null;
  setMessage: (message: string | null) => void;
  tags: Tag[];
}) {
  const { bookmarks, addBookmark, updateBookmark, deleteBookmark } =
    useBookmarks();
  const { mutation, store } = useManifest();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(
    null
  );

  const handleShowBookmarkModal = (bookmark: Bookmark) => {
    setIsModalOpen(true);
    setSelectedBookmark(bookmark);
  };

  const handleCloseBookmarkModal = () => {
    setIsModalOpen(false);
    setSelectedBookmark(null);
  };

  const handleShowCreateBookmarkModal = () => {
    setIsModalOpen(true);
    setSelectedBookmark(null);
  };

  const handleSaveBookmark = (data: {
    url: string;
    title: string;
    tags: string[];
  }) => {
    try {
      if (selectedBookmark) {
        updateBookmark(selectedBookmark.id, data);
      } else {
        addBookmark(data);
      }
    } catch (error) {
      // Show validation error
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save bookmark";
      setMessage(errorMessage);
      // setTimeout(() => setMessage(null), 5000);
    }
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

  const handleSaveManifest = async () => {
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

  if (bookmarks.length === 0) {
    return (
      <div className={styles.container}>
        <MessageBanner
          message="No bookmarks found"
          onRetry={handleSaveManifest}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <BookmarkModal
        isOpen={isModalOpen}
        bookmark={selectedBookmark}
        onClose={handleCloseBookmarkModal}
        onSave={handleSaveBookmark}
        tags={tags}
      />

      <BookmarkHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddBookmark={handleShowCreateBookmarkModal}
      />

      <MessageBanner message={message} onRetry={handleSaveManifest} />

      <BookmarkList
        bookmarks={bookmarks}
        tags={tags}
        searchQuery={searchQuery}
        onEdit={handleShowBookmarkModal}
        onDelete={handleDeleteBookmark}
      />
    </div>
  );
}
