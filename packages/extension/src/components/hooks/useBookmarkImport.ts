import { useState } from 'react'

import {
  loadManifestData,
  useManifest
} from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useBookmarks } from '@/components/hooks/useBookmarks'
import { useTags } from '@/components/hooks/useTags'

import {
  generateCollectionsFromTree,
  prepareBookmarksForImport,
  processBookmarkImport
} from '@/lib/bookmarkImport'

export interface UseBookmarkImportOptions {
  preserveFolderStructure: boolean
  importDuplicates: boolean
}

export interface UseBookmarkImportReturn {
  importFile: File | null
  setImportFile: (file: File | null) => void
  isImporting: boolean
  handleImport: () => Promise<void>
}

export function useBookmarkImport(
  options: UseBookmarkImportOptions
): UseBookmarkImportReturn {
  const { preserveFolderStructure, importDuplicates } = options

  const { setFlash } = useNavigation()
  const { addBookmarks } = useBookmarks()
  const { tags, createTag } = useTags()
  const { manifest, reload: reloadManifest, save } = useManifest()

  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!importFile) {
      setFlash('Please select a bookmark file')
      return
    }

    setIsImporting(true)
    setFlash(null)

    try {
      // Step 1: Process the bookmark file
      const processResult = await processBookmarkImport({
        file: importFile,
        preserveFolderStructure,
        existingTags: tags
      })

      if (processResult.errors.length > 0) {
        console.warn('Import warnings:', processResult.errors)
      }

      if (processResult.bookmarksWithPaths.length === 0) {
        setFlash('No valid bookmarks found in the file')
        setIsImporting(false)
        return
      }

      // Step 2: Create tags if needed
      if (processResult.tagsToCreate.length > 0) {
        for (const tagToCreate of processResult.tagsToCreate) {
          try {
            await createTag(tagToCreate)
          } catch (error) {
            console.error(`Error creating tag "${tagToCreate.name}":`, error)
          }
        }
        // Reload manifest to get the newly created tags with their IDs
        await reloadManifest()
      }

      // Step 3: Get updated tags and manifest
      const latestManifestData = await loadManifestData()
      const updatedTags =
        latestManifestData?.manifest.tags || manifest?.tags || []
      const updatedBookmarks =
        latestManifestData?.manifest.items || manifest?.items || []
      const latestManifest = latestManifestData?.manifest || manifest

      // Step 4: Create collections from folder structure if enabled
      if (preserveFolderStructure && latestManifest) {
        const tagNameToId = new Map<string, string>()
        updatedTags.forEach((tag) => {
          tagNameToId.set(tag.name.toLowerCase(), tag.id)
        })

        const existingCollections = latestManifest.collections || []
        const existingCollectionNames = new Set(
          existingCollections.map((c) => c.name.toLowerCase())
        )

        // Generate collections from folder tree
        const newCollections = generateCollectionsFromTree(
          processResult.folderTree,
          tagNameToId,
          undefined,
          existingCollections.length
        )

        // Filter out collections that already exist (by name)
        const collectionsToAdd = newCollections.filter(
          (c) => !existingCollectionNames.has(c.name.toLowerCase())
        )

        if (collectionsToAdd.length > 0) {
          await save({
            ...latestManifest,
            collections: [...existingCollections, ...collectionsToAdd]
          })
          await reloadManifest()
        }
      }

      // Step 5: Get fresh manifest data after collections are created
      const finalManifestData = await loadManifestData()
      const finalTags = finalManifestData?.manifest.tags || manifest?.tags || []
      const finalBookmarks =
        finalManifestData?.manifest.items || manifest?.items || []

      // Step 6: Prepare bookmarks (map tags and filter duplicates)
      const prepareResult = prepareBookmarksForImport({
        bookmarksWithPaths: processResult.bookmarksWithPaths,
        preserveFolderStructure,
        importDuplicates,
        tags: finalTags,
        existingBookmarks: finalBookmarks
      })

      // Step 7: Add all bookmarks in a single batch operation
      if (prepareResult.bookmarksToImport.length === 0) {
        const message =
          prepareResult.duplicatesCount > 0
            ? `All ${prepareResult.totalBookmarks} bookmark${prepareResult.totalBookmarks !== 1 ? 's' : ''} are duplicates and were skipped`
            : 'No bookmarks to import'
        setFlash(message)
        setImportFile(null)
        return
      }

      await addBookmarks(prepareResult.bookmarksToImport)
      let successMessage = `Successfully imported ${prepareResult.bookmarksToImport.length} bookmark${prepareResult.bookmarksToImport.length !== 1 ? 's' : ''}`
      if (prepareResult.duplicatesCount > 0) {
        successMessage += ` (${prepareResult.duplicatesCount} duplicate${prepareResult.duplicatesCount !== 1 ? 's' : ''} skipped)`
      }
      setFlash(successMessage)
      setImportFile(null)
    } catch (error) {
      const errorMessage = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setFlash(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  return {
    importFile,
    setImportFile,
    isImporting,
    handleImport
  }
}
