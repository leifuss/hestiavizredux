import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

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

      <div className="about-panel">
        <div className="about-content">
          <h2>About HestiaViz Redux</h2>

          <p>
            This is a reconstruction of <strong>HestiaViz</strong>, originally developed as part of the
            HESTIA project (Herodotus Encoded Space-Text-Imaging Archive) at the Open University, UK.
          </p>

          <h3>The Original Project</h3>
          <p>
            HESTIA was a collaborative digital humanities project that explored the
            spatial dimensions of Herodotus's <em>Histories</em>. The project created
            tools for "geo-reading" — understanding how ancient narratives construct
            and move through geographic space.
          </p>
          <p>
            The original HestiaViz interface was built on <strong>GapVis</strong> (Google Ancient Places
            Visualization), a Backbone.js application created by Nick Rabinowitz. When the
            Open University servers were decommissioned and Google Maps API policies changed,
            the original became inaccessible.
          </p>

          <h3>This Reconstruction</h3>
          <p>
            HestiaViz Redux preserves the core scholarly utility of the original: the ability
            to read Herodotus while visualizing his geographic imagination. Key features include:
          </p>
          <ul>
            <li><strong>Bidirectional linking</strong> between text and map</li>
            <li><strong>Geographic memory</strong> — showing places from previous chapters with fading opacity</li>
            <li><strong>641 annotated places</strong> linked to the Pleiades gazetteer</li>
            <li><strong>8,077 place mentions</strong> across all nine books</li>
          </ul>

          <h3>Data Sources</h3>
          <p>
            Place annotations come from the original HESTIA project, preserved in{' '}
            <a href="https://recogito.pelagios.org/document/tjrrsqn4dwmgep" target="_blank" rel="noopener noreferrer">
              Recogito
            </a>. The text is A.D. Godley's translation from the{' '}
            <a href="http://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.01.0126" target="_blank" rel="noopener noreferrer">
              Perseus Digital Library
            </a>. Place coordinates are linked to{' '}
            <a href="https://pleiades.stoa.org/" target="_blank" rel="noopener noreferrer">
              Pleiades
            </a>, the gazetteer of ancient places.
          </p>

          <h3>Links</h3>
          <ul className="links-list">
            <li>
              <a href="https://hestia.open.ac.uk/" target="_blank" rel="noopener noreferrer">
                HESTIA Project (archived)
              </a>
            </li>
            <li>
              <a href="https://github.com/nrabinowitz/gapvis" target="_blank" rel="noopener noreferrer">
                GapVis source code
              </a>
            </li>
            <li>
              <a href="https://pelagios.org/" target="_blank" rel="noopener noreferrer">
                Pelagios Network
              </a>
            </li>
            <li>
              <a href="https://recogito.pelagios.org/" target="_blank" rel="noopener noreferrer">
                Recogito annotation platform
              </a>
            </li>
          </ul>

          <p className="credits">
            Original HESTIA team: Elton Barker, Stefan Bouzarovski, Christopher Pelling, Leif Isaksen.
            <br />
            Redux reconstruction: 2025.
          </p>
        </div>
      </div>

      <div className="summary-map">
        <MapContainer
          center={[38, 28]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            opacity={0.7}
          />
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
