import { useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

function TextPanel({
  bookData,
  bookInfo,
  currentChapter,
  currentChapterData,
  placesData,
  selectedPlace,
  highlightedPlaces,
  onChapterChange,
  onPlaceClick,
  language,
  onLanguageToggle,
  greekText
}) {
  const textRef = useRef(null)

  // Scroll to top when chapter changes
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = 0
    }
  }, [currentChapter])

  // Build annotated text with clickable place names
  const annotatedText = useMemo(() => {
    if (!currentChapterData) return null

    const text = currentChapterData.text
    const places = currentChapterData.places || []

    // Sort places by startOffset to process in order
    const sortedPlaces = [...places].sort((a, b) => a.startOffset - b.startOffset)

    const segments = []
    let lastEnd = 0

    sortedPlaces.forEach((place, index) => {
      // Add text before this place
      if (place.startOffset > lastEnd) {
        segments.push({
          type: 'text',
          content: text.slice(lastEnd, place.startOffset)
        })
      }

      // Add the place mention
      const placeData = placesData?.[place.placeId]
      const hasCoords = placeData && placeData.lat && placeData.lng

      segments.push({
        type: 'place',
        placeId: place.placeId,
        name: place.name,
        hasCoords,
        isSelected: selectedPlace === place.placeId,
        isHighlighted: highlightedPlaces.has(place.placeId)
      })

      lastEnd = place.endOffset
    })

    // Add remaining text
    if (lastEnd < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastEnd)
      })
    }

    return segments
  }, [currentChapterData, placesData, selectedPlace, highlightedPlaces])

  // Get unlocated places for current chapter
  const unlocatedPlaces = useMemo(() => {
    if (!currentChapterData) return []

    const places = currentChapterData.places || []
    const unlocated = []
    const seen = new Set()

    places.forEach(place => {
      const placeData = placesData?.[place.placeId]
      const hasCoords = placeData && placeData.lat && placeData.lng

      if (!hasCoords && !seen.has(place.placeId)) {
        seen.add(place.placeId)
        unlocated.push({
          id: place.placeId,
          name: place.name
        })
      }
    })

    return unlocated.sort((a, b) => a.name.localeCompare(b.name))
  }, [currentChapterData, placesData])

  // Get sorted chapter IDs for navigation
  const chapterIds = useMemo(() => {
    if (!bookData?.chapters) return []
    return bookData.chapters.map(ch => ch.id).sort((a, b) => a - b)
  }, [bookData])

  const currentIndex = chapterIds.indexOf(currentChapter)

  const handlePrev = () => {
    if (currentIndex > 0) {
      onChapterChange(chapterIds[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < chapterIds.length - 1) {
      onChapterChange(chapterIds[currentIndex + 1])
    }
  }

  const handleChapterSelect = (e) => {
    onChapterChange(parseInt(e.target.value, 10))
  }

  if (!bookData || !currentChapterData) {
    return <div className="text-panel"><div className="loading">Loading chapter...</div></div>
  }

  return (
    <div className="text-panel">
      <div className="text-header">
        <div>
          <Link
            to="/"
            className="back-button ui-text"
            style={{ marginRight: '1rem' }}
          >
            ← Books
          </Link>
          <h2 style={{ display: 'inline' }}>{bookInfo?.title || `Book ${bookData.id}`}</h2>
        </div>
        <div className="chapter-nav">
          <button
            onClick={onLanguageToggle}
            className="language-toggle"
            title="Switch between English and Greek text"
          >
            {language === 'english' ? 'Ελληνικά' : 'English'}
          </button>
          <button onClick={handlePrev} disabled={currentIndex <= 0}>
            ← Prev
          </button>
          <select value={currentChapter} onChange={handleChapterSelect}>
            {chapterIds.map(chId => (
              <option key={chId} value={chId}>
                Chapter {chId}
              </option>
            ))}
          </select>
          <button onClick={handleNext} disabled={currentIndex >= chapterIds.length - 1}>
            Next →
          </button>
        </div>
      </div>

      <div className="text-content" ref={textRef}>
        <div className="chapter-section">
          <div className="chapter-number ui-text">
            Chapter {currentChapter} (of {chapterIds.length})
          </div>
          {language === 'greek' ? (
            <div className="chapter-text greek-text">
              {greekText || 'Loading Greek text...'}
            </div>
          ) : (
            <div className="chapter-text">
              {annotatedText?.map((segment, index) => {
              if (segment.type === 'text') {
                return <span key={index}>{segment.content}</span>
              }

              const className = [
                'place-mention',
                segment.isSelected ? 'selected' : '',
                segment.isHighlighted ? 'highlighted' : '',
                !segment.hasCoords ? 'no-coords' : ''
              ].filter(Boolean).join(' ')

              if (segment.hasCoords) {
                return (
                  <Link
                    key={index}
                    to={`/place/${segment.placeId}`}
                    className={className}
                    onClick={(e) => {
                      e.preventDefault()
                      onPlaceClick(segment.placeId)
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      window.location.href = `#/place/${segment.placeId}`
                    }}
                    title={`Click to highlight on map, double-click for details`}
                  >
                    {segment.name}
                  </Link>
                )
              }

              return (
                <span
                  key={index}
                  className={className}
                  style={{ opacity: 0.7, cursor: 'default' }}
                  title="Location unknown"
                >
                  {segment.name}
                </span>
              )
            })}
            </div>
          )}

          {language === 'english' && unlocatedPlaces.length > 0 && (
            <div className="unlocated-places">
              <h4>Places without known coordinates ({unlocatedPlaces.length})</h4>
              <div className="unlocated-list">
                {unlocatedPlaces.map(place => (
                  <span key={place.id} className="unlocated-place">
                    {place.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TextPanel
