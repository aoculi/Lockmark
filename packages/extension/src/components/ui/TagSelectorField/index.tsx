import { Tag, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Tag as EntityTag } from '@/lib/types'

import styles from './styles.module.css'

export const TagSelectorField = ({
  tags,
  selectedTags,
  onChange
}: {
  tags: EntityTag[]
  selectedTags: string[]
  onChange: (selectedTags: string[]) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter tags based on search query and exclude already selected tags
  const filteredTags = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return tags.filter(
      (tag) =>
        !selectedTags.includes(tag.id) &&
        (query === '' || tag.name.toLowerCase().includes(query))
    )
  }, [tags, selectedTags, searchQuery])

  // Get selected tag objects for display
  const selectedTagObjects = useMemo(() => {
    return tags.filter((tag) => selectedTags.includes(tag.id))
  }, [tags, selectedTags])

  // Handle tag selection
  const handleSelectTag = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      onChange([...selectedTags, tagId])
      setSearchQuery('')
      setHighlightedIndex(0)
      inputRef.current?.focus()
    }
  }

  // Handle tag removal
  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedTags.filter((id) => id !== tagId))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredTags.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter' && filteredTags.length > 0) {
      e.preventDefault()
      handleSelectTag(filteredTags[highlightedIndex].id)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (
      e.key === 'Backspace' &&
      searchQuery === '' &&
      selectedTags.length > 0
    ) {
      // Remove last tag when backspace is pressed on empty input
      onChange(selectedTags.slice(0, -1))
    }
  }

  // Reset highlighted index when filtered tags change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredTags.length])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={containerRef} className={styles.container}>
      <Input
        ref={inputRef}
        size='lg'
        placeholder={selectedTagObjects.length > 0 ? '' : 'Select tags...'}
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      >
        <Tag size={16} />

        <div className={styles.inputContent}>
          {/* Selected tags displayed as badges */}
          {selectedTagObjects.length > 0 && (
            <div className={styles.selectedTags}>
              {selectedTagObjects.map((tag) => (
                <Button
                  key={tag.id}
                  color='light'
                  size='sm'
                  onClick={(e) => handleRemoveTag(tag.id, e)}
                >
                  <span className={styles.tagName}>{tag.name}</span>
                  <X className={styles.removeIcon} height='12' width='12' />
                </Button>
              ))}
            </div>
          )}
        </div>
      </Input>

      {/* Autocomplete suggestions */}
      {isOpen && filteredTags.length > 0 && (
        <div ref={suggestionsRef} className={styles.suggestions}>
          <div className={styles.suggestionsList}>
            {filteredTags.map((tag, index) => (
              <Button
                key={tag.id}
                variant={index === highlightedIndex ? 'solid' : 'solid'}
                color={index === highlightedIndex ? 'primary' : 'dark'}
                className={`${styles.suggestionItem}`}
                onClick={() => handleSelectTag(tag.id)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
