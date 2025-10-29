import type { ManifestV1 } from './types';

export type ConflictResolution = {
    merged: ManifestV1;
    hasConflicts: boolean;
    conflicts: string[];
};

export type ThreeWayMergeInput = {
    base: ManifestV1;
    local: ManifestV1;
    remote: ManifestV1;
};

/**
 * Simple 3-way merge for ManifestV1
 *
 * Strategy:
 * - If both local and remote changed the same property, prefer remote and re-apply local changes that don't collide
 * - For arrays (items, tags), merge by ID - prefer remote for conflicts
 * - For strings (chain_head), prefer remote if both changed
 * - For numbers (version), use remote value
 */
export function threeWayMerge(input: ThreeWayMergeInput): ConflictResolution {
    const { base, local, remote } = input;
    const conflicts: string[] = [];
    let hasConflicts = false;

    // Start with remote as base (prefer remote for conflicts)
    const merged: ManifestV1 = { ...remote };

    // Check version conflicts
    if (base.version !== local.version &&
        base.version !== remote.version &&
        local.version !== remote.version) {
        conflicts.push('version');
        hasConflicts = true;
    }
    // Use remote version (already copied above)

    // Check chain_head conflicts
    if (base.chain_head !== local.chain_head &&
        base.chain_head !== remote.chain_head &&
        local.chain_head !== remote.chain_head) {
        conflicts.push('chain_head');
        hasConflicts = true;
        // Prefer remote (already copied above)
    }

    // Merge items (bookmarks) by ID
    const baseItemIds = new Set(base.items?.map(item => item.id) || []);
    const localItemIds = new Set(local.items?.map(item => item.id) || []);
    const remoteItemIds = new Set(remote.items?.map(item => item.id) || []);
    const localItemMap = new Map(local.items?.map(item => [item.id, item]) || []);
    const remoteItemMap = new Map(remote.items?.map(item => [item.id, item]) || []);

    // Start with remote items
    const mergedItems = new Map(remoteItemMap);

    // Add local-only items (added locally, not in base or remote)
    local.items?.forEach(item => {
        if (!baseItemIds.has(item.id) && !remoteItemIds.has(item.id)) {
            mergedItems.set(item.id, item);
        }
    });

    // Remove items that were deleted locally (in base but not in local, but still in remote)
    base.items?.forEach(item => {
        if (!localItemIds.has(item.id) && remoteItemIds.has(item.id)) {
            mergedItems.delete(item.id);
        }
    });

    // Check for conflicts (items modified in both local and remote)
    base.items?.forEach(baseItem => {
        const localItem = localItemMap.get(baseItem.id);
        const remoteItem = remoteItemMap.get(baseItem.id);
        if (localItem && remoteItem &&
            JSON.stringify(baseItem) !== JSON.stringify(localItem) &&
            JSON.stringify(baseItem) !== JSON.stringify(remoteItem) &&
            JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
            conflicts.push(`item:${baseItem.id}`);
            hasConflicts = true;
        }
    });

    merged.items = Array.from(mergedItems.values());

    // Merge tags by ID
    const baseTagIds = new Set(base.tags?.map(tag => tag.id) || []);
    const localTagIds = new Set(local.tags?.map(tag => tag.id) || []);
    const remoteTagIds = new Set(remote.tags?.map(tag => tag.id) || []);
    const localTagMap = new Map(local.tags?.map(tag => [tag.id, tag]) || []);
    const remoteTagMap = new Map(remote.tags?.map(tag => [tag.id, tag]) || []);

    // Start with remote tags
    const mergedTags = new Map(remoteTagMap);

    // Add local-only tags
    local.tags?.forEach(tag => {
        if (!baseTagIds.has(tag.id) && !remoteTagIds.has(tag.id)) {
            mergedTags.set(tag.id, tag);
        }
    });

    // Remove tags that were deleted locally
    base.tags?.forEach(tag => {
        if (!localTagIds.has(tag.id) && remoteTagIds.has(tag.id)) {
            mergedTags.delete(tag.id);
        }
    });

    // Check for tag conflicts
    base.tags?.forEach(baseTag => {
        const localTag = localTagMap.get(baseTag.id);
        const remoteTag = remoteTagMap.get(baseTag.id);
        if (localTag && remoteTag &&
            JSON.stringify(baseTag) !== JSON.stringify(localTag) &&
            JSON.stringify(baseTag) !== JSON.stringify(remoteTag) &&
            JSON.stringify(localTag) !== JSON.stringify(remoteTag)) {
            conflicts.push(`tag:${baseTag.id}`);
            hasConflicts = true;
        }
    });

    merged.tags = Array.from(mergedTags.values());

    return {
        merged,
        hasConflicts,
        conflicts,
    };
}

/**
 * Simple conflict resolution strategies
 */
export type ConflictResolutionStrategy = 'keepLocal' | 'keepRemote' | 'merge';

export function resolveConflict(
    input: ThreeWayMergeInput,
    strategy: ConflictResolutionStrategy
): ConflictResolution {
    switch (strategy) {
        case 'keepLocal':
            return {
                merged: input.local,
                hasConflicts: false,
                conflicts: [],
            };

        case 'keepRemote':
            return {
                merged: input.remote,
                hasConflicts: false,
                conflicts: [],
            };

        case 'merge':
        default:
            return threeWayMerge(input);
    }
}

/**
 * Check if two manifests are equivalent (ignoring version)
 */
export function manifestsEqual(a: ManifestV1, b: ManifestV1): boolean {
    return (
        a.chain_head === b.chain_head &&
        JSON.stringify(a.items || []) === JSON.stringify(b.items || []) &&
        JSON.stringify(a.tags || []) === JSON.stringify(b.tags || [])
    );
}

/**
 * Get a human-readable description of conflicts
 */
export function getConflictDescription(conflicts: string[]): string {
    if (conflicts.length === 0) {
        return 'No conflicts';
    }

    const descriptions: Record<string, string> = {
        version: 'Version number',
        chain_head: 'Chain head',
        items: 'Bookmarks',
        tags: 'Tags',
    };

    return conflicts.map(conflict => descriptions[conflict] || conflict).join(', ');
}
