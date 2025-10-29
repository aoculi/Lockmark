
import { useEffect, useState } from 'react';
import type { Bookmark, Tag } from '../../../lib/types';
import { useLogout } from '../../hooks/auth';
import { useBookmarks, useTags } from '../../hooks/bookmarks';
import { useManifest } from '../../hooks/vault';
import { keystoreManager } from '../../store';
import styles from './styles.module.css';

function BookmarkEditModal({
    bookmark,
    tags,
    onSave,
    onCancel,
}: {
    bookmark: Bookmark | null;
    tags: Tag[];
    onSave: (data: { url: string; title: string; notes?: string; tags: string[] }) => void;
    onCancel: () => void;
}) {
    const [url, setUrl] = useState(bookmark?.url || '');
    const [title, setTitle] = useState(bookmark?.title || '');
    const [notes, setNotes] = useState(bookmark?.notes || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(bookmark?.tags || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;
        onSave({
            url: url.trim(),
            title: title.trim(),
            notes: notes.trim() || undefined,
            tags: selectedTags,
        });
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>{bookmark ? 'Edit Bookmark' : 'Add Bookmark'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="url">URL *</label>
                        <input
                            id="url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className={styles.formInput}
                            placeholder="https://example.com"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={styles.formInput}
                            placeholder="Bookmark title"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={styles.formTextarea}
                            placeholder="Additional notes..."
                            rows={3}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Tags</label>
                        {tags.length === 0 ? (
                            <p className={styles.emptyState}>No tags available</p>
                        ) : (
                            <div className={styles.tagCheckboxes}>
                                {tags.map(tag => (
                                    <label key={tag.id} className={styles.tagCheckbox}>
                                        <input
                                            type="checkbox"
                                            checked={selectedTags.includes(tag.id)}
                                            onChange={() => toggleTag(tag.id)}
                                        />
                                        <span>{tag.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onCancel} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitButton}>
                            {bookmark ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Vault() {
    const logoutMutation = useLogout();
    const { query, mutation, store } = useManifest();
    const { bookmarks, addBookmark, updateBookmark, deleteBookmark } = useBookmarks();
    const { tags, createTag, renameTag, deleteTag } = useTags();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
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
                console.error('Failed to check keystore status:', error);
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
            setMessage('Changes saved successfully');
            setTimeout(() => setMessage(null), 3000);
        } else if (mutation.isError) {
            const error = mutation.error as any;
            if (error?.details?.offline) {
                setMessage('Working offline—will retry');
            } else {
                setMessage('Failed to save changes');
                setTimeout(() => setMessage(null), 3000);
            }
        }
    }, [mutation.isSuccess, mutation.isError]);

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleSave = async () => {
        if (store.status === 'dirty' || store.status === 'offline') {
            try {
                await mutation.mutateAsync();
            } catch (error) {
                // Error handling done in useEffect
            }
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
        if (editingBookmark) {
            updateBookmark(editingBookmark.id, data);
        } else {
            addBookmark(data);
        }
        setEditingBookmark(null);
        setIsAddingBookmark(false);
    };

    const handleCancelEdit = () => {
        setEditingBookmark(null);
        setIsAddingBookmark(false);
    };

    const handleDeleteBookmark = (id: string) => {
        if (confirm('Are you sure you want to delete this bookmark?')) {
            deleteBookmark(id);
        }
    };

    const handleAddTag = () => {
        const name = prompt('Enter tag name:');
        if (name && name.trim()) {
            createTag({ name: name.trim() });
        }
    };

    const handleEditTag = (tag: Tag) => {
        const newName = prompt('Enter new tag name:', tag.name);
        if (newName && newName.trim() && newName !== tag.name) {
            renameTag(tag.id, newName.trim());
        }
    };

    const handleDeleteTag = (id: string) => {
        if (confirm('Are you sure you want to delete this tag? It will be removed from all bookmarks.')) {
            deleteTag(id);
        }
    };

    // Filter bookmarks by search query
    const filteredBookmarks = bookmarks.filter(bookmark => {
        const query = searchQuery.toLowerCase();
        return (
            bookmark.title.toLowerCase().includes(query) ||
            bookmark.url.toLowerCase().includes(query) ||
            bookmark.notes?.toLowerCase().includes(query) ||
            bookmark.tags.some(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return tag?.name.toLowerCase().includes(query);
            })
        );
    });

    // Get hostname from URL
    const getHostname = (url: string): string => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    // Format date
    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleDateString();
    };

    // Get tag name by ID
    const getTagName = (tagId: string): string => {
        return tags.find(t => t.id === tagId)?.name || tagId;
    };

    if (isChecking) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <p>Checking vault status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Vault</h2>
                <div className={styles.headerActions}>
                    {(store.status === 'dirty' || store.status === 'offline') && (
                        <button
                            onClick={handleSave}
                            disabled={mutation.isPending}
                            className={styles.saveButton}
                        >
                            {mutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className={`${styles.logoutButton} ${logoutMutation.isPending ? styles.logoutButtonDisabled : ''}`}
                    >
                        {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={message.includes('error') || message.includes('Failed') ? styles.errorMessage : styles.successMessage}>
                    {message}
                    {store.status === 'offline' && (
                        <button onClick={handleRetry} className={styles.retryButton}>
                            Retry
                        </button>
                    )}
                </div>
            )}

            <div className={styles.card}>
                {isUnlocked ? (
                    <>
                        <p className={styles.successMessage}>🔓 Vault Unlocked</p>
                        <p>Your vault is unlocked and ready to use.</p>
                        <p>All sensitive data is stored in memory only.</p>
                        <p>Keys will be cleared when you close the extension or logout.</p>

                        {query.isLoading && <p>Loading manifest...</p>}
                        {query.isError && <p className={styles.errorMessage}>Failed to load manifest</p>}

                        {store.manifest && (
                            <>
                                {/* Toolbar */}
                                <div className={styles.toolbar}>
                                    <input
                                        type="text"
                                        placeholder="Search bookmarks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                    <button
                                        onClick={handleAddBookmark}
                                        className={styles.actionButton}
                                    >
                                        Add Bookmark
                                    </button>
                                    <button
                                        onClick={() => setIsManagingTags(!isManagingTags)}
                                        className={styles.actionButton}
                                    >
                                        {isManagingTags ? 'Hide Tags' : 'Manage Tags'}
                                    </button>
                                </div>

                                {/* Tag Manager */}
                                {isManagingTags && (
                                    <div className={styles.tagManager}>
                                        <h3>Tags</h3>
                                        <div className={styles.tagList}>
                                            {tags.length === 0 ? (
                                                <p className={styles.emptyState}>No tags yet</p>
                                            ) : (
                                                tags.map(tag => (
                                                    <div key={tag.id} className={styles.tagItem}>
                                                        <span className={styles.tagName}>{tag.name}</span>
                                                        <button
                                                            onClick={() => handleEditTag(tag)}
                                                            className={styles.tagButton}
                                                        >
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTag(tag.id)}
                                                            className={styles.tagButton}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                            <button
                                                onClick={handleAddTag}
                                                className={styles.addTagButton}
                                            >
                                                + Add Tag
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Bookmarks List */}
                                <div className={styles.bookmarksList}>
                                    <h3>
                                        Bookmarks ({filteredBookmarks.length}{filteredBookmarks.length !== bookmarks.length ? ` of ${bookmarks.length}` : ''})
                                    </h3>
                                    {filteredBookmarks.length === 0 ? (
                                        <p className={styles.emptyState}>
                                            {bookmarks.length === 0
                                                ? 'No bookmarks yet. Click "Add Bookmark" to get started.'
                                                : 'No bookmarks match your search.'}
                                        </p>
                                    ) : (
                                        <div className={styles.bookmarksGrid}>
                                            {filteredBookmarks.map(bookmark => (
                                                <div key={bookmark.id} className={styles.bookmarkCard}>
                                                    <div className={styles.bookmarkHeader}>
                                                        <h4 className={styles.bookmarkTitle}>
                                                            {bookmark.title || '(Untitled)'}
                                                        </h4>
                                                        <div className={styles.bookmarkActions}>
                                                            <button
                                                                onClick={() => handleEditBookmark(bookmark)}
                                                                className={styles.iconButton}
                                                                title="Edit"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBookmark(bookmark.id)}
                                                                className={styles.iconButton}
                                                                title="Delete"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={bookmark.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.bookmarkUrl}
                                                    >
                                                        {getHostname(bookmark.url)}
                                                    </a>
                                                    {bookmark.notes && (
                                                        <p className={styles.bookmarkNotes}>{bookmark.notes}</p>
                                                    )}
                                                    {bookmark.tags.length > 0 && (
                                                        <div className={styles.bookmarkTags}>
                                                            {bookmark.tags.map(tagId => (
                                                                <span key={tagId} className={styles.tag}>
                                                                    {getTagName(tagId)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className={styles.bookmarkMeta}>
                                                        Updated: {formatDate(bookmark.updated_at)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bookmark Edit Modal */}
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
                        <p>This may happen if the extension was restarted or keys were cleared.</p>
                    </>
                )}
            </div>
        </div>
    );
}
