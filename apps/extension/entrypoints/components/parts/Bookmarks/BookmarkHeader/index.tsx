import { IconButton } from "@radix-ui/themes";
import { Plus, Search } from "lucide-react";

import Background from "@/entrypoints/components/ui/Background";
import styles from "./styles.module.css";

export default function BookmarkHeader({
  searchQuery,
  onSearchChange,
  onAddBookmark,
  onQuickAdd, // Add this new prop
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddBookmark: () => void;
  onQuickAdd: () => void; // Add this
}) {
  return (
    <div className={styles.container}>
      <div className={styles.searchBarContainer}>
        <Search strokeWidth={1} size={16} />
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <IconButton
        onClick={onQuickAdd}
        className={styles.quickAddButton}
        color="gray"
        variant="solid"
        highContrast
        size="1"
      >
        <Plus strokeWidth={1} size={18} />
      </IconButton>

      <Background tone="dark" isActive={true} />
      {/* <Button onClick={onAddBookmark} className={styles.addBookmarkButton}>
        <Plus strokeWidth={1} />
      </Button> */}
    </div>
  );
}
