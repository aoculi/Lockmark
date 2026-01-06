import { useState } from 'react'

import { useManifest } from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useBookmarks } from '@/components/hooks/useBookmarks'
import type { Bookmark, Collection } from '@/lib/types'

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatBookmarkHtml(bookmark: Bookmark): string {
  const addDate = bookmark.created_at
    ? Math.floor(bookmark.created_at / 1000)
    : Math.floor(Date.now() / 1000)
  const lastModified = bookmark.updated_at
    ? Math.floor(bookmark.updated_at / 1000)
    : addDate

  return `<DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${addDate}" LAST_MODIFIED="${lastModified}">${escapeHtml(bookmark.title)}</A></DT>`
}

interface CollectionNode {
  collection: Collection
  bookmarks: Bookmark[]
  children: CollectionNode[]
}

function buildCollectionTree(
  collections: Collection[],
  bookmarks: Bookmark[],
  getBookmarksForCollection: (c: Collection) => Bookmark[]
): CollectionNode[] {
  const childrenMap = new Map<string | undefined, Collection[]>()

  for (const c of collections) {
    const parentId = c.parentId
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, [])
    }
    childrenMap.get(parentId)!.push(c)
  }

  // Sort by order
  for (const [, children] of childrenMap) {
    children.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER
      return orderA !== orderB ? orderA - orderB : a.name.localeCompare(b.name)
    })
  }

  function buildNode(collection: Collection): CollectionNode {
    const children = childrenMap.get(collection.id) || []
    return {
      collection,
      bookmarks: getBookmarksForCollection(collection),
      children: children.map(buildNode)
    }
  }

  const roots = childrenMap.get(undefined) || []
  return roots.map(buildNode)
}

function generateCollectionHtml(
  node: CollectionNode,
  htmlParts: string[],
  exportedBookmarkIds: Set<string>
): void {
  const addDate = Math.floor((node.collection.created_at || Date.now()) / 1000)

  // Open folder
  htmlParts.push(
    `<DT><H3 ADD_DATE="${addDate}">${escapeHtml(node.collection.name)}</H3>`
  )
  htmlParts.push('<DL><p>')

  // Add bookmarks in this collection (only if not already exported)
  for (const bookmark of node.bookmarks) {
    if (!exportedBookmarkIds.has(bookmark.id)) {
      htmlParts.push(formatBookmarkHtml(bookmark))
      exportedBookmarkIds.add(bookmark.id)
    }
  }

  // Recursively add child collections
  for (const child of node.children) {
    generateCollectionHtml(child, htmlParts, exportedBookmarkIds)
  }

  // Close folder
  htmlParts.push('</DL><p>')
  htmlParts.push('</DT>')
}

export function useBookmarkExport() {
  const { setFlash } = useNavigation()
  const { bookmarks } = useBookmarks()
  const { manifest } = useManifest()

  const [isExporting, setIsExporting] = useState(false)
  const [exportWithCollections, setExportWithCollections] = useState(true)

  const collections = manifest?.collections || []

  const handleExport = async () => {
    if (bookmarks.length === 0) {
      setFlash('No bookmarks to export')
      return
    }

    setIsExporting(true)
    setFlash(null)

    try {
      // Generate HTML in Netscape Bookmark File Format
      const htmlParts: string[] = [
        '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
        '<TITLE>Bookmarks</TITLE>',
        '<H1>Bookmarks</H1>',
        '<DL><p>'
      ]

      const exportedBookmarkIds = new Set<string>()

      if (exportWithCollections && collections.length > 0) {
        // Build helper to get bookmarks for a collection
        const getBookmarksForCollection = (
          collection: Collection
        ): Bookmark[] => {
          if (collection.tagFilter.tagIds.length === 0) return []
          const { mode, tagIds } = collection.tagFilter
          return bookmarks.filter((b) =>
            mode === 'any'
              ? tagIds.some((id) => b.tags.includes(id))
              : tagIds.every((id) => b.tags.includes(id))
          )
        }

        // Build collection tree and generate HTML
        const tree = buildCollectionTree(
          collections,
          bookmarks,
          getBookmarksForCollection
        )

        for (const node of tree) {
          generateCollectionHtml(node, htmlParts, exportedBookmarkIds)
        }

        // Add uncategorized bookmarks (those not in any collection)
        const uncategorizedBookmarks = bookmarks.filter(
          (b) => !exportedBookmarkIds.has(b.id)
        )

        if (uncategorizedBookmarks.length > 0) {
          htmlParts.push(
            `<DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}">Uncategorized</H3>`
          )
          htmlParts.push('<DL><p>')
          for (const bookmark of uncategorizedBookmarks) {
            htmlParts.push(formatBookmarkHtml(bookmark))
          }
          htmlParts.push('</DL><p>')
          htmlParts.push('</DT>')
        }
      } else {
        // Export without collections - flat list
        for (const bookmark of bookmarks) {
          htmlParts.push(formatBookmarkHtml(bookmark))
        }
      }

      htmlParts.push('</DL><p>')

      const htmlContent = htmlParts.join('\n')

      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lockmark-bookmarks-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setFlash('Bookmarks exported successfully')
    } catch (error) {
      console.error('Error exporting bookmarks:', error)
      setFlash('Failed to export bookmarks')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportWithCollections,
    setExportWithCollections,
    hasCollections: collections.length > 0,
    handleExport
  }
}
