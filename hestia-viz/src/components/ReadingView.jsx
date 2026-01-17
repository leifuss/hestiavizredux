import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TextPanel from './TextPanel'
import MapPanel from './MapPanel'

// Memory window: how many previous chapters to show
const MEMORY_WINDOW = 10

function ReadingView({ booksIndex, placesData, bookTexts }) {
  const { bookId, chapterId } = useParams()
  const navigate = useNavigate()
  const [currentChapter, setCurrentChapter] = useState(1)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [highlightedPlaces, setHighlightedPlaces] = useState(new Set())
  const [language, setLanguage] = useState('english') // 'english' or 'greek'
  const [greekText, setGreekText] = useState({}) // Cache for Greek text by chapter

  const bookNum = parseInt(bookId, 10)
  const bookInfo = booksIndex?.books?.find(b => b.id === bookNum)

  // Get book data directly from bundled data (no fetch needed)
  const bookData = bookTexts?.[bookNum]

  // Handle chapter from URL
  useEffect(() => {
    if (chapterId) {
      setCurrentChapter(parseInt(chapterId, 10))
    } else {
      setCurrentChapter(1)
    }
  }, [chapterId])

  // Get places for current chapter and memory window
  const getMemoryPlaces = useCallback(() => {
    if (!bookData || !placesData) return { current: [], memory: [] }

    const currentPlaces = []
    const memoryPlaces = []
    const seenCurrent = new Set()
    const seenMemory = new Set()

    // Current chapter places
    const currentChapterData = bookData.chapters.find(c => c.id === currentChapter)
    if (currentChapterData) {
      currentChapterData.places.forEach(p => {
        const placeData = placesData[p.placeId]
        if (placeData && placeData.lat && placeData.lng && !seenCurrent.has(p.placeId)) {
          seenCurrent.add(p.placeId)
          currentPlaces.push({
            ...placeData,
            opacity: 1.0
          })
        }
      })
    }

    // Memory places from previous chapters
    for (let i = 1; i <= MEMORY_WINDOW; i++) {
      const memChapter = currentChapter - i
      if (memChapter < 1) break

      const memChapterData = bookData.chapters.find(c => c.id === memChapter)
      if (!memChapterData) continue

      const opacity = 1.0 - (i * 0.09) // Decreasing opacity

      memChapterData.places.forEach(p => {
        const placeData = placesData[p.placeId]
        if (placeData && placeData.lat && placeData.lng &&
            !seenCurrent.has(p.placeId) && !seenMemory.has(p.placeId)) {
          seenMemory.add(p.placeId)
          memoryPlaces.push({
            ...placeData,
            opacity,
            memoryChapter: memChapter
          })
        }
      })
    }

    return { current: currentPlaces, memory: memoryPlaces }
  }, [bookData, placesData, currentChapter])

  const handleChapterChange = (newChapter) => {
    setCurrentChapter(newChapter)
    navigate(`/book/${bookNum}/chapter/${newChapter}`, { replace: true })
    setSelectedPlace(null)
    setHighlightedPlaces(new Set())
  }

  const handlePlaceClick = (placeId) => {
    setSelectedPlace(placeId)
    setHighlightedPlaces(new Set([placeId]))
  }

  const handleMapPlaceClick = (placeId) => {
    // Navigate to place detail page
    navigate(`/place/${placeId}`)
  }

  const handleLanguageToggle = () => {
    const newLang = language === 'english' ? 'greek' : 'english'
    setLanguage(newLang)

    // Fetch Greek text if switching to Greek and not cached
    if (newLang === 'greek' && !greekText[currentChapter]) {
      fetchGreekText(bookNum, currentChapter)
    }
  }

  // Fetch Greek text when chapter changes and we're in Greek mode
  useEffect(() => {
    if (language === 'greek' && !greekText[currentChapter]) {
      fetchGreekText(bookNum, currentChapter)
    }
  }, [currentChapter, language, greekText, bookNum])

  const fetchGreekText = async (bookId, chapter) => {
    try {
      // Perseus API endpoint for Herodotus Greek text
      // The CTS URN for Herodotus is: urn:cts:greekLit:tlg0016.tlg001.perseus-grc2
      const urn = `urn:cts:greekLit:tlg0016.tlg001.perseus-grc2:${bookId}.${chapter}`
      const apiUrl = `https://cts.perseids.org/api/cts/?request=GetPassage&urn=${urn}`

      const response = await fetch(apiUrl)
      const text = await response.text()

      // Parse XML response to extract Greek text
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')
      const passageNode = xmlDoc.querySelector('passage') || xmlDoc.querySelector('TEI')

      let greekContent = ''
      if (passageNode) {
        greekContent = passageNode.textContent.trim()
      }

      setGreekText(prev => ({
        ...prev,
        [chapter]: greekContent || 'Greek text not available for this chapter.'
      }))
    } catch (error) {
      console.error('Error fetching Greek text:', error)
      setGreekText(prev => ({
        ...prev,
        [chapter]: 'Error loading Greek text. Please try again.'
      }))
    }
  }

  if (!bookData) {
    return <div className="loading">Book not found...</div>
  }

  const { current: currentPlaces, memory: memoryPlaces } = getMemoryPlaces()
  const currentChapterData = bookData.chapters.find(c => c.id === currentChapter)

  return (
    <div className="reading-view">
      <TextPanel
        bookData={bookData}
        bookInfo={bookInfo}
        currentChapter={currentChapter}
        currentChapterData={currentChapterData}
        placesData={placesData}
        selectedPlace={selectedPlace}
        highlightedPlaces={highlightedPlaces}
        onChapterChange={handleChapterChange}
        onPlaceClick={handlePlaceClick}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        greekText={greekText[currentChapter]}
      />
      <MapPanel
        currentPlaces={currentPlaces}
        memoryPlaces={memoryPlaces}
        selectedPlace={selectedPlace}
        placesData={placesData}
        onPlaceClick={handleMapPlaceClick}
        currentChapter={currentChapter}
        language={language}
        bookInfo={bookInfo}
      />
    </div>
  )
}

export default ReadingView
