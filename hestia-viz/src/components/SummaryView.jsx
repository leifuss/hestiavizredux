import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const { BaseLayer } = LayersControl

function SummaryView({ booksIndex, placesData }) {
  const navigate = useNavigate()
  const [selectedBook, setSelectedBook] = useState(1)
  const [bookPlaces, setBookPlaces] = useState([])

  // Calculate max place count for visualization
  const maxPlaces = useMemo(() => {
    if (!booksIndex?.books) return 1
    return Math.max(...booksIndex.books.map(b => b.placeCount))
  }, [booksIndex])

  // Get places for selected book
  useEffect(() => {
    if (!placesData) return

    const places = []
    const seen = new Set()

    Object.values(placesData).forEach(place => {
      if (!place.lat || !place.lng) return

      const inBook = place.occurrences.some(occ => occ.book === selectedBook)
      if (inBook && !seen.has(place.id)) {
        seen.add(place.id)
        places.push(place)
      }
    })

    setBookPlaces(places)
  }, [selectedBook, placesData])

  const handleBookClick = (bookId) => {
    setSelectedBook(bookId)
  }

  const handleBookDoubleClick = (bookId) => {
    navigate(`/book/${bookId}`)
  }

  if (!booksIndex?.books) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="summary-view">
      <div className="books-panel">
        <h2>The Histories</h2>
        <p className="ui-text" style={{ marginBottom: '1rem', color: 'var(--color-brown-light)', fontSize: '0.9rem' }}>
          Click to preview places, double-click to read
        </p>
        <ul className="book-list">
          {booksIndex.books.map(book => (
            <li
              key={book.id}
              className={`book-item ${selectedBook === book.id ? 'selected' : ''}`}
              onClick={() => handleBookClick(book.id)}
              onDoubleClick={() => handleBookDoubleClick(book.id)}
            >
              <h3>{book.title}</h3>
              <div className="book-stats ui-text">
                {book.chapterCount} chapters · {book.placeCount} place mentions
              </div>
              <div className="place-bar">
                <div
                  className="place-bar-fill"
                  style={{ width: `${(book.placeCount / maxPlaces) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="summary-map">
        <MapContainer
          center={[38, 28]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <LayersControl position="topright">
            <BaseLayer checked name="Satellite Imagery">
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                opacity={0.7}
              />
            </BaseLayer>

            <BaseLayer name="Modern Political Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            </BaseLayer>

            <BaseLayer name="CAWM Ancient World">
              <TileLayer
                attribution='&copy; <a href="https://cawm.lib.uiowa.edu/">CAWM</a> (CC BY 4.0)'
                url="http://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png"
                maxZoom={11}
              />
            </BaseLayer>
          </LayersControl>

          {bookPlaces.map(place => (
            <CircleMarker
              key={place.id}
              center={[place.lat, place.lng]}
              radius={6}
              pathOptions={{
                fillColor: '#c45a3b',
                fillOpacity: 0.8,
                color: '#fff',
                weight: 2
              }}
            >
              <Popup>
                <div className="popup-place-name">{place.name}</div>
                {place.placeType && (
                  <div className="popup-place-type">{place.placeType}</div>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem' }}>
            Book {selectedBook}: {booksIndex.books[selectedBook - 1]?.title.split(': ')[1]}
          </h3>
          <p className="ui-text" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-brown-light)' }}>
            {bookPlaces.length} unique places
          </p>
        </div>
      </div>
    </div>
  )
}

export default SummaryView
