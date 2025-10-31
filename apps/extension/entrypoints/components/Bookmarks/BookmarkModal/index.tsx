import { Button, Dialog, Flex, TextField } from "@radix-ui/themes";
import { useState } from "react";

import { MAX_TAGS_PER_ITEM } from "@/entrypoints/lib/validation";
import type { Bookmark } from "../../../lib/types";

import styles from "./styles.module.css";

export const BookmarkModal = ({
  isOpen,
  bookmark,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  bookmark: Bookmark | null;
  onClose: () => void;
  onSave: (data: { url: string; title: string; tags: string[] }) => void;
}) => {
  const [url, setUrl] = useState(bookmark?.url || "");
  const [title, setTitle] = useState(bookmark?.title || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    bookmark?.tags || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // URL validation
    if (!url.trim()) {
      newErrors.url = "URL is required";
    } else {
      try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          newErrors.url = "URL must start with http:// or https://";
        }
      } catch {
        newErrors.url = "Please enter a valid URL";
      }
    }

    // Title validation
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    // Tags validation
    if (selectedTags.length > MAX_TAGS_PER_ITEM) {
      newErrors.tags = `Maximum ${MAX_TAGS_PER_ITEM} tags per bookmark`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      url: url.trim(),
      title: title.trim(),
      tags: selectedTags,
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content maxWidth="450px">
        <Flex gap="3" mt="4" justify="between">
          <Dialog.Close>
            <Button variant="soft" color="gray" onClick={onClose}>
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button onClick={handleSubmit}>
              {bookmark ? "Save" : "Create"}
            </Button>
          </Dialog.Close>
        </Flex>

        <Dialog.Title>
          {bookmark ? "Edit Bookmark" : "Add Bookmark"}
        </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Make changes to your profile.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <TextField.Root
            size="3"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errors.url) setErrors({ ...errors, url: "" });
            }}
          />

          {errors.url && (
            <span className={styles.fieldError}>{errors.url}</span>
          )}

          <TextField.Root
            size="3"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: "" });
            }}
            placeholder="Bookmark title"
          />

          {errors.title && (
            <span className={styles.fieldError}>{errors.title}</span>
          )}

          <TextField.Root size="3" placeholder="Tags" />
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
