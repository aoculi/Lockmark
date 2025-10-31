import { Button, DropdownMenu, Text } from "@radix-ui/themes";
import { ArrowUpDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useTags } from "@/entrypoints/hooks/useTags";
import type { Bookmark, Tag as EntityTag } from "@/entrypoints/lib/types";
import Tag from "./Tag";

import { StatusIndicator } from "../StatusIndicator";
import styles from "./styles.module.css";

export default function Tags({
  bookmarks,
  currentTagId,
  onSelectTag,
}: {
  bookmarks: Bookmark[];
  currentTagId: string | null;
  onSelectTag: (id: string) => void;
}) {
  const { tags, createTag, renameTag, deleteTag } = useTags();
  const [message, setMessage] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"name" | "count">("name");

  const onAddTag = () => {
    const name = prompt("Enter tag name:");
    if (name && name.trim()) {
      try {
        createTag({ name: name.trim() });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create tag";
        setMessage(errorMessage);
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  const onEditTag = (tag: EntityTag) => {
    const newName = prompt("Enter new tag name:", tag.name);
    if (newName && newName.trim() && newName !== tag.name) {
      try {
        renameTag(tag.id, newName.trim());
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to rename tag";
        setMessage(errorMessage);
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  const onDeleteTag = (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this tag? It will be removed from all bookmarks."
      )
    ) {
      try {
        deleteTag(id);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete tag";
        setMessage(errorMessage);
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  {
    /* MODAL: Edit tags */
  }

  const sortedTags = useMemo(() => {
    const tagsWithCounts = tags.map((tag) => ({
      tag,
      count: bookmarks.filter((bookmark) => bookmark.tags.includes(tag.id))
        .length,
    }));

    if (sortMode === "name") {
      return tagsWithCounts.sort((a, b) =>
        a.tag.name.localeCompare(b.tag.name)
      );
    } else {
      return tagsWithCounts.sort((a, b) => b.count - a.count);
    }
  }, [tags, bookmarks, sortMode]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Text size="4" color="violet">
            Tags
          </Text>

          <div className={styles.headerActions}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost">
                  <ArrowUpDown strokeWidth={1} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  onClick={() => setSortMode("name")}
                  disabled={sortMode === "name"}
                >
                  Sort by name
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => setSortMode("count")}
                  disabled={sortMode === "count"}
                >
                  Sort by bookmark count
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <Button onClick={onAddTag} variant="ghost">
              <Plus strokeWidth={1} />
            </Button>
          </div>
        </div>

        <div className={styles.list}>
          <Tag
            name="All tags"
            count={bookmarks.length}
            all={true}
            active={currentTagId === "all"}
            onClick={() => onSelectTag("all")}
          />

          {tags.length === 0 && (
            <p className={styles.emptyState}>No tags yet</p>
          )}

          {sortedTags.length > 0 &&
            sortedTags.map(({ tag, count }) => (
              <Tag
                key={tag.id}
                onClick={() => onSelectTag(tag.id)}
                name={tag.name}
                count={count}
                all={false}
                active={currentTagId === tag.id}
              />
            ))}
        </div>
      </div>
      <StatusIndicator />
    </div>
  );
}
