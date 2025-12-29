import type { Bookmark, Tag } from './types'
import { isValidUrl } from './validation'

export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'auto'

export interface ParsedBookmark {
  url: string
  title: string
  folderPath: string[]
  addDate?: number
  lastModified?: number
}

export interface ImportResult {
  bookmarks: ParsedBookmark[]
  folders: string[]
  errors: string[]
}

export function detectBrowserType(
  filename: string,
  content: string
): BrowserType {
  const lowerFilename = filename.toLowerCase()
  const trimmed = content.trim()

  if (lowerFilename.includes('chrome') || lowerFilename.includes('bookmarks')) {
    return 'chrome'
  }
  if (lowerFilename.includes('firefox') || lowerFilename.includes('places')) {
    return 'firefox'
  }
  if (lowerFilename.includes('safari')) {
    return 'safari'
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed)
      if (data.version && data.roots) {
        return 'chrome'
      }
    } catch {}
  }

  if (content.includes('NETSCAPE-Bookmark-file-1')) {
    if (content.includes('HREF=')) {
      if (
        content.includes('Personal Toolbar') ||
        content.includes('Bookmarks Toolbar')
      ) {
        return 'chrome'
      }
      if (
        content.includes('Mozilla Firefox') ||
        content.includes('places.sqlite')
      ) {
        return 'firefox'
      }
      if (content.includes('Safari') || content.includes('WebKit')) {
        return 'safari'
      }
    }
  }

  return 'auto'
}

interface ChromeBookmarkNode {
  type: 'url' | 'folder'
  name: string
  url?: string
  date_added?: string
  date_modified?: string
  children?: ChromeBookmarkNode[]
}

interface ChromeBookmarkRoot {
  version: number
  roots: {
    bookmark_bar?: ChromeBookmarkNode
    other?: ChromeBookmarkNode
    synced?: ChromeBookmarkNode
  }
}

interface FirefoxBookmarkNode {
  guid: string
  title: string
  typeCode: number
  type: string
  uri?: string
  dateAdded?: number
  lastModified?: number
  children?: FirefoxBookmarkNode[]
  root?: string
  index?: number
  iconUri?: string
}

function chromeTimestampToMs(timestamp: string): number {
  const chromeEpoch = Date.UTC(1601, 0, 1)
  const microseconds = parseInt(timestamp, 10)
  return chromeEpoch + Math.floor(microseconds / 1000)
}

function firefoxTimestampToMs(timestamp: number): number {
  return Math.floor(timestamp / 1000)
}

interface BookmarkCollector {
  bookmarks: ParsedBookmark[]
  folders: Set<string>
  errors: string[]
}

function createCollector(): BookmarkCollector {
  return {
    bookmarks: [],
    folders: new Set<string>(),
    errors: []
  }
}

function addBookmark(
  collector: BookmarkCollector,
  url: string,
  title: string,
  folderPath: string[],
  addDate?: number,
  lastModified?: number
): void {
  if (!url) {
    collector.errors.push(`Bookmark missing URL: ${title || 'Unknown'}`)
    return
  }

  if (!isValidUrl(url)) {
    collector.errors.push(`Invalid URL: ${url} (${title || 'Unknown'})`)
    return
  }

  folderPath.forEach((folder) => {
    if (folder) collector.folders.add(folder)
  })

  collector.bookmarks.push({
    url,
    title: title || 'Untitled',
    folderPath: [...folderPath].filter(Boolean),
    addDate,
    lastModified
  })
}

function toImportResult(collector: BookmarkCollector): ImportResult {
  return {
    bookmarks: collector.bookmarks,
    folders: Array.from(collector.folders).sort(),
    errors: collector.errors
  }
}

function parseChromeJsonBookmarkFile(content: string): ImportResult {
  const collector = createCollector()

  try {
    const data: ChromeBookmarkRoot = JSON.parse(content)

    if (!data.roots) {
      collector.errors.push(
        'Invalid Chrome bookmark JSON format: missing roots'
      )
      return toImportResult(collector)
    }

    function traverseNode(
      node: ChromeBookmarkNode,
      folderPath: string[] = []
    ): void {
      if (!node.type) return

      if (node.type === 'url') {
        addBookmark(
          collector,
          node.url!,
          node.name,
          folderPath,
          node.date_added ? chromeTimestampToMs(node.date_added) : undefined,
          node.date_modified
            ? chromeTimestampToMs(node.date_modified)
            : undefined
        )
      } else if (node.type === 'folder') {
        const folderName = node.name || 'Untitled Folder'
        const newPath = [...folderPath, folderName]
        collector.folders.add(folderName)

        if (node.children?.length) {
          node.children.forEach((child) => traverseNode(child, newPath))
        }
      }
    }

    const roots = [data.roots.bookmark_bar, data.roots.other, data.roots.synced]
    roots.forEach((root) => {
      if (root) traverseNode(root, [])
    })
  } catch (error) {
    collector.errors.push(
      `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return toImportResult(collector)
}

function parseFirefoxJsonBookmarkFile(content: string): ImportResult {
  const collector = createCollector()

  try {
    const data: FirefoxBookmarkNode = JSON.parse(content)

    if (data.guid !== 'root________') {
      collector.errors.push(
        'Invalid Firefox bookmark JSON format: missing root'
      )
      return toImportResult(collector)
    }

    function traverseNode(
      node: FirefoxBookmarkNode,
      folderPath: string[] = []
    ): void {
      if (node.typeCode === 1) {
        addBookmark(
          collector,
          node.uri!,
          node.title,
          folderPath,
          node.dateAdded ? firefoxTimestampToMs(node.dateAdded) : undefined,
          node.lastModified
            ? firefoxTimestampToMs(node.lastModified)
            : undefined
        )
      } else if (node.typeCode === 2) {
        const folderName = node.title || 'Untitled Folder'
        if (folderName) {
          const newPath = [...folderPath, folderName]
          collector.folders.add(folderName)

          if (node.children?.length) {
            node.children.forEach((child) => traverseNode(child, newPath))
          }
        } else if (node.children?.length) {
          node.children.forEach((child) => traverseNode(child, folderPath))
        }
      }
    }

    if (data.children?.length) {
      data.children.forEach((child) => traverseNode(child, []))
    }
  } catch (error) {
    collector.errors.push(
      `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return toImportResult(collector)
}

function parseHtmlBookmarkFile(content: string): ImportResult {
  const collector = createCollector()

  if (!content.includes('NETSCAPE-Bookmark-file-1')) {
    collector.errors.push(
      'Invalid bookmark file format. Expected Netscape Bookmark File Format.'
    )
    return toImportResult(collector)
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')

  function getFolderPath(linkElement: Element): string[] {
    const path: string[] = []
    let bookmarkDl: Element | null = linkElement

    while (bookmarkDl && bookmarkDl.tagName !== 'DL') {
      bookmarkDl = bookmarkDl.parentElement
    }

    if (!bookmarkDl) return path

    let currentDl: Element | null = bookmarkDl

    while (currentDl) {
      let dt: Element | null = currentDl.parentElement
      while (dt && dt.tagName !== 'DT') {
        dt = dt.parentElement
      }

      if (!dt) break

      const h3 = dt.querySelector('H3')
      if (h3?.textContent?.trim()) {
        path.unshift(h3.textContent.trim())
      }

      let parentDl: Element | null = dt.parentElement
      while (parentDl && parentDl.tagName !== 'DL') {
        parentDl = parentDl.parentElement
      }

      if (!parentDl) break

      currentDl = parentDl
    }

    return path
  }

  const links = doc.querySelectorAll('A[HREF]')

  links.forEach((link) => {
    try {
      const href = link.getAttribute('HREF')
      const title = link.textContent?.trim() || 'Untitled'

      if (!href) {
        collector.errors.push(`Bookmark missing URL: ${title}`)
        return
      }

      if (!isValidUrl(href)) {
        collector.errors.push(`Invalid URL: ${href} (${title})`)
        return
      }

      const addDate = link.getAttribute('ADD_DATE')
      const lastModified = link.getAttribute('LAST_MODIFIED')

      const folderPath = getFolderPath(link)
      folderPath.forEach((folder) => collector.folders.add(folder))

      collector.bookmarks.push({
        url: href,
        title,
        folderPath,
        addDate: addDate ? parseInt(addDate, 10) * 1000 : undefined,
        lastModified: lastModified
          ? parseInt(lastModified, 10) * 1000
          : undefined
      })
    } catch (error) {
      collector.errors.push(
        `Error parsing bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })

  const folderHeaders = doc.querySelectorAll('H3')
  folderHeaders.forEach((h3) => {
    const folderName = h3.textContent?.trim()
    if (folderName) {
      collector.folders.add(folderName)
    }
  })

  return toImportResult(collector)
}

type FileFormat = 'html' | 'json' | 'unknown'
type JsonFormat = 'chrome' | 'firefox' | 'unknown'

function detectFileFormat(content: string): FileFormat {
  const trimmed = content.trim()

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {}
  }

  if (
    trimmed.includes('NETSCAPE-Bookmark-file-1') ||
    trimmed.includes('<HTML>') ||
    trimmed.includes('<html>')
  ) {
    return 'html'
  }

  return 'unknown'
}

function detectJsonFormat(content: string): JsonFormat {
  try {
    const parsed = JSON.parse(content)

    if (parsed.guid === 'root________' && parsed.root === 'placesRoot') {
      return 'firefox'
    }

    if (parsed.version && parsed.roots) {
      return 'chrome'
    }
  } catch {}

  return 'unknown'
}

function convertToBookmarks(
  parsedBookmarks: ParsedBookmark[],
  createFolderTags: boolean,
  existingTags: Tag[]
): {
  bookmarks: Array<{
    bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>
    folderPath: string[]
  }>
  tagsToCreate: Omit<Tag, 'id'>[]
} {
  const tagNameToId = new Map<string, string>()
  existingTags.forEach((tag) => {
    tagNameToId.set(tag.name.toLowerCase(), tag.id)
  })

  const tagsToCreate: Omit<Tag, 'id'>[] = []

  if (createFolderTags) {
    const folderSet = new Set<string>()
    parsedBookmarks.forEach((bookmark) => {
      bookmark.folderPath.forEach((folder) => folderSet.add(folder))
    })

    folderSet.forEach((folderName) => {
      const lowerName = folderName.toLowerCase()
      if (
        !tagNameToId.has(lowerName) &&
        !tagsToCreate.some((t) => t.name.toLowerCase() === lowerName)
      ) {
        tagsToCreate.push({
          name: folderName,
          hidden: false
        })
      }
    })
  }

  const bookmarks = parsedBookmarks.map((parsed) => {
    const tagIds: string[] = []

    if (createFolderTags) {
      parsed.folderPath.forEach((folder) => {
        const tagId = tagNameToId.get(folder.toLowerCase())
        if (tagId) {
          tagIds.push(tagId)
        }
      })
    }

    return {
      bookmark: {
        url: parsed.url,
        title: parsed.title,
        note: '',
        picture: '',
        tags: tagIds
      },
      folderPath: parsed.folderPath
    }
  })

  return { bookmarks, tagsToCreate }
}

export interface ProcessBookmarkImportOptions {
  file: File
  createFolderTags: boolean
  existingTags: Tag[]
}

export interface ProcessBookmarkImportResult {
  bookmarksWithPaths: Array<{
    bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>
    folderPath: string[]
  }>
  tagsToCreate: Omit<Tag, 'id'>[]
  errors: string[]
  browserType: BrowserType
}

export async function processBookmarkImport(
  options: ProcessBookmarkImportOptions
): Promise<ProcessBookmarkImportResult> {
  const { file, createFolderTags, existingTags } = options
  const errors: string[] = []

  try {
    const content = await file.text()
    const format = detectFileFormat(content)

    if (format === 'unknown') {
      errors.push('Unknown file format. Expected HTML or JSON bookmark file.')
      return {
        bookmarksWithPaths: [],
        tagsToCreate: [],
        errors,
        browserType: 'auto'
      }
    }

    const browserType = detectBrowserType(file.name, content)
    let parseResult: ImportResult

    if (format === 'json') {
      const jsonFormat = detectJsonFormat(content)
      if (jsonFormat === 'firefox') {
        parseResult = parseFirefoxJsonBookmarkFile(content)
      } else if (jsonFormat === 'chrome') {
        parseResult = parseChromeJsonBookmarkFile(content)
      } else {
        errors.push(
          'Unsupported JSON bookmark format. Only Chrome and Firefox JSON formats are supported.'
        )
        return {
          bookmarksWithPaths: [],
          tagsToCreate: [],
          errors,
          browserType: 'auto'
        }
      }
    } else {
      parseResult = parseHtmlBookmarkFile(content)
    }

    if (parseResult.errors.length > 0 && parseResult.bookmarks.length === 0) {
      errors.push('Failed to parse bookmark file. No bookmarks were extracted.')
    }

    if (parseResult.errors.length > 0) {
      errors.push(...parseResult.errors)
    }

    if (parseResult.bookmarks.length === 0) {
      errors.push('No bookmarks found in the file')
    }

    const { bookmarks, tagsToCreate } = convertToBookmarks(
      parseResult.bookmarks,
      createFolderTags,
      existingTags
    )

    return {
      bookmarksWithPaths: bookmarks,
      tagsToCreate,
      errors,
      browserType
    }
  } catch (error) {
    errors.push(
      `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return {
      bookmarksWithPaths: [],
      tagsToCreate: [],
      errors,
      browserType: 'auto'
    }
  }
}

export interface PrepareBookmarksForImportOptions {
  bookmarksWithPaths: Array<{
    bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>
    folderPath: string[]
  }>
  createFolderTags: boolean
  importDuplicates: boolean
  tags: Tag[]
  existingBookmarks: Bookmark[]
}

export interface PrepareBookmarksForImportResult {
  bookmarksToImport: Array<Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>>
  duplicatesCount: number
  totalBookmarks: number
}

export function prepareBookmarksForImport(
  options: PrepareBookmarksForImportOptions
): PrepareBookmarksForImportResult {
  const {
    bookmarksWithPaths,
    createFolderTags,
    importDuplicates,
    tags,
    existingBookmarks
  } = options

  const tagNameToId = new Map<string, string>()
  tags.forEach((tag) => {
    tagNameToId.set(tag.name.toLowerCase(), tag.id)
  })

  const updatedBookmarks = bookmarksWithPaths.map(
    ({ bookmark, folderPath }) => {
      if (!createFolderTags) {
        return bookmark
      }

      const tagIds = new Set(bookmark.tags || [])
      folderPath.forEach((folder) => {
        const tagId = tagNameToId.get(folder.toLowerCase())
        if (tagId) {
          tagIds.add(tagId)
        }
      })

      return {
        url: bookmark.url,
        title: bookmark.title,
        note: bookmark.note,
        picture: bookmark.picture,
        tags: Array.from(tagIds)
      }
    }
  )

  let bookmarksToImport = updatedBookmarks
  let duplicatesCount = 0

  if (!importDuplicates) {
    const existingUrls = new Set(
      existingBookmarks.map((b) => b.url.trim().toLowerCase())
    )
    const filtered: typeof updatedBookmarks = []
    for (const bookmark of updatedBookmarks) {
      const normalizedUrl = bookmark.url.trim().toLowerCase()
      if (existingUrls.has(normalizedUrl)) {
        duplicatesCount++
      } else {
        filtered.push(bookmark)
        existingUrls.add(normalizedUrl)
      }
    }
    bookmarksToImport = filtered
  }

  return {
    bookmarksToImport,
    duplicatesCount,
    totalBookmarks: updatedBookmarks.length
  }
}
