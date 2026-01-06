import { useState } from 'react'

import { useManifest } from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useTags } from '@/components/hooks/useTags'

import {
  createCollectionsFromTree,
  prepareBookmarksForImport,
  processBookmarkImport
} from '@/lib/bookmarkImport'
import type { Bookmark, Collection } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { validateBookmarkInput } from '@/lib/validation'

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
  const { tags } = useTags()
  const { manifest, reload: reloadManifest, save } = useManifest()

  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!importFile) {
      setFlash('Please select a bookmark file')
      return
    }

    // Check if manifest is loaded before proceeding
    if (!manifest) {
      setFlash('Cannot import: manifest not loaded. Please try again.')
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

      // Step 2: Create collections and map paths to IDs
      const existingCollections = manifest.collections || []
      let newCollections: Collection[] = []
      let pathToCollectionId = new Map<string, string>()

      if (preserveFolderStructure) {
        const result = createCollectionsFromTree(
          processResult.folderTree,
          existingCollections
        )
        newCollections = result.collections
        pathToCollectionId = result.pathToIdMap
      }

      // Step 3: Prepare bookmarks
      const prepareResult = prepareBookmarksForImport({
        bookmarksWithPaths: processResult.bookmarksWithPaths,
        preserveFolderStructure,
        importDuplicates,
        tags: manifest.tags || [],
        existingBookmarks: manifest.items || []
      })

      if (prepareResult.bookmarksToImport.length === 0) {
        const message =
          prepareResult.duplicatesCount > 0
            ? `All ${prepareResult.totalBookmarks} bookmark${prepareResult.totalBookmarks !== 1 ? 's' : ''} are duplicates and were skipped`
            : 'No bookmarks to import'
        setFlash(message)
        setImportFile(null)
        setIsImporting(false)
        return
      }

      // Step 4: Create bookmarks with collection IDs
      const now = Date.now()
      const urlToPath = new Map<string, string[]>()
      processResult.bookmarksWithPaths.forEach(({ bookmark, folderPath }) => {
        const key = bookmark.url.trim().toLowerCase()
        if (!urlToPath.has(key)) {
          urlToPath.set(key, folderPath)
        }
      })

      const newBookmarks: Bookmark[] = []
      for (const bookmark of prepareResult.bookmarksToImport) {
        const validationError = validateBookmarkInput({
          url: bookmark.url,
          title: bookmark.title,
          note: bookmark.note,
          picture: bookmark.picture,
          tags: bookmark.tags
        })
        if (validationError) {
          throw new Error(
            `Validation error for "${bookmark.title}": ${validationError}`
          )
        }

        const path = urlToPath.get(bookmark.url.trim().toLowerCase()) || []
        const pathKey = path.join('/')
        const collectionId = preserveFolderStructure
          ? pathToCollectionId.get(pathKey)
          : undefined

        newBookmarks.push({
          ...bookmark,
          id: generateId(),
          collectionId,
          created_at: now,
          updated_at: now
        })
      }

      // Step 5: Save everything
      const updatedManifest = {
        ...manifest,
        items: [...(manifest.items || []), ...newBookmarks],
        collections: [...existingCollections, ...newCollections]
      }

      await save(updatedManifest)
      await reloadManifest()

      // Step 6: Success message
      let successMessage = `Successfully imported ${newBookmarks.length} bookmark${newBookmarks.length !== 1 ? 's' : ''}`
      if (prepareResult.duplicatesCount > 0) {
        successMessage += ` (${prepareResult.duplicatesCount} duplicate${prepareResult.duplicatesCount !== 1 ? 's' : ''} skipped)`
      }
      if (newCollections.length > 0) {
        successMessage += `, ${newCollections.length} collection${newCollections.length !== 1 ? 's' : ''}`
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
