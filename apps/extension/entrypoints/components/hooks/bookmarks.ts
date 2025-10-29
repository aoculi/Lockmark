/**
 * CRUD hooks for bookmarks and tags
 * Optimistic mutations that update manifestStore and trigger save
 */

import { useCallback } from 'react';
import { generateId } from '../../lib/id';
import type { Bookmark, Tag } from '../../lib/types';
import { manifestStore } from '../store/manifest';
import { useManifest } from './vault';

/**
 * Hook for bookmark CRUD operations
 */
export function useBookmarks() {
    const { mutation, store } = useManifest();

    const addBookmark = useCallback((bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>) => {
        if (!store.manifest) return;

        const now = Date.now();
        const newBookmark: Bookmark = {
            ...bookmark,
            id: generateId(),
            created_at: now,
            updated_at: now,
        };

        manifestStore.apply(manifest => ({
            ...manifest,
            items: [...(manifest.items || []), newBookmark],
        }));

        // Trigger save mutation (autosave will handle it)
        if (mutation && store.status === 'dirty') {
            // The autosave in useManifest will handle this
        }
    }, [store.manifest, store.status, mutation]);

    const updateBookmark = useCallback((id: string, updates: Partial<Omit<Bookmark, 'id' | 'created_at'>>) => {
        if (!store.manifest) return;

        manifestStore.apply(manifest => ({
            ...manifest,
            items: (manifest.items || []).map(item =>
                item.id === id
                    ? { ...item, ...updates, updated_at: Date.now() }
                    : item
            ),
        }));
    }, [store.manifest]);

    const deleteBookmark = useCallback((id: string) => {
        if (!store.manifest) return;

        manifestStore.apply(manifest => ({
            ...manifest,
            items: (manifest.items || []).filter(item => item.id !== id),
        }));
    }, [store.manifest]);

    const getBookmark = useCallback((id: string): Bookmark | undefined => {
        return store.manifest?.items?.find(item => item.id === id);
    }, [store.manifest]);

    return {
        bookmarks: store.manifest?.items || [],
        addBookmark,
        updateBookmark,
        deleteBookmark,
        getBookmark,
    };
}

/**
 * Hook for tag CRUD operations
 */
export function useTags() {
    const { store } = useManifest();

    const createTag = useCallback((tag: Omit<Tag, 'id'>) => {
        if (!store.manifest) return;

        const newTag: Tag = {
            ...tag,
            id: generateId(),
        };

        manifestStore.apply(manifest => ({
            ...manifest,
            tags: [...(manifest.tags || []), newTag],
        }));
    }, [store.manifest]);

    const renameTag = useCallback((id: string, name: string) => {
        if (!store.manifest) return;

        manifestStore.apply(manifest => ({
            ...manifest,
            tags: (manifest.tags || []).map(tag =>
                tag.id === id ? { ...tag, name } : tag
            ),
        }));
    }, [store.manifest]);

    const deleteTag = useCallback((id: string) => {
        if (!store.manifest) return;

        manifestStore.apply(manifest => {
            // Remove tag from tag list
            const updatedTags = (manifest.tags || []).filter(tag => tag.id !== id);

            // Remove tag from all bookmarks
            const updatedItems = (manifest.items || []).map(item => ({
                ...item,
                tags: item.tags.filter(tagId => tagId !== id),
            }));

            return {
                ...manifest,
                tags: updatedTags,
                items: updatedItems,
            };
        });
    }, [store.manifest]);

    const getTag = useCallback((id: string): Tag | undefined => {
        return store.manifest?.tags?.find(tag => tag.id === id);
    }, [store.manifest]);

    return {
        tags: store.manifest?.tags || [],
        createTag,
        renameTag,
        deleteTag,
        getTag,
    };
}
