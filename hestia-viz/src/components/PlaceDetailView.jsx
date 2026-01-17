import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function PlaceDetailView({ placesData, booksIndex }) {
  const { placeId } = useParams()

  const place = placesData?.[placeId]

  // Group occurrences by book
  const occurrencesByBook = useMemo(() => {
    if (!place?.occurrences) return {}

    const grouped = {}
    place.occurrences.forEach(occ => {
      if (!grouped[occ.book]) {
        grouped[occ.book] = []
      }
      grouped[occ.book].push(occ.chapter)
    })

    // Sort chapters within each book and remove duplicates
    Object.keys(grouped).forEach(bookId => {
      grouped[bookId] = [...new Set(grouped[bookId])].sort((a, b) => a - b)
    })

    return grouped
  }, [place])

  // Get co-occurring places (places that appear in the same chapters)
  const coOccurringPlaces = useMemo(() => {
    if (!place?.occurrences || !placesData) return []

    const chapterSet = new Set()
    place.occurrences.forEach(occ => {
      chapterSet.add(`${occ.book}-${occ.chapter}`)
    })

    const coPlaces = {}
    Object.values(placesData).forEach(p => {
      if (p.id === placeId) return

      let count = 0
      p.occurrences?.forEach(occ => {
        if (chapterSet.has(`${occ.book}-${occ.chapter}`)) {
          count++
        }
      })

      if (count > 0) {
        coPlaces[p.id] = { ...p, coCount: count }
      }
    })

    return Object.values(coPlaces)
      .sort((a, b) => b.coCount - a.coCount)
      .slice(0, 10)
  }, [place, placesData, placeId])

  if (!place) {
    return (
      <div className="place-detail-view">
        <div className="place-info">
          <Link to="/" className="back-button ui-text">
            ← Back to Books
          </Link>
          <h2>Place not found</h2>
          <p>The place "{placeId}" could not be found in the gazetteer.</p>
        </div>
      </div>
    )
  }

  const totalOccurrences = place.occurrences?.length || 0
  const bookTitle = (bookId) => {
    const book = booksIndex?.books?.find(b => b.id === bookId)
    return book?.title || `Book ${bookId}`
  }

  return (
    <div className="place-detail-view">
      <div className="place-info">
        <Link to="/" className="back-button ui-text">
          ← Back to Books
        </Link>

        <h2>{place.name}</h2>

        {place.lat && place.lng && (
          <div className="place-coords">
            {place.lat.toFixed(4)}°N, {place.lng.toFixed(4)}°E
          </div>
        )}

        {place.placeType && (
          <div className="place-description">
            <strong>Type:</strong> {place.placeType}
            {place.isEthnic && <span> (ethnic designation)</span>}
          </div>
        )}

        <div className="place-links">
          {place.pleiadesUri && (
            <a
              href={place.pleiadesUri}
              target="_blank"
              rel="noopener noreferrer"
            >
              View in Pleiades
            </a>
          )}
          {place.geonamesUri && (
            <a
              href={place.geonamesUri}
              target="_blank"
              rel="noopener noreferrer"
            >
              View in GeoNames
            </a>
          )}
        </div>

        <div className="occurrences-section">
          <h3>
            {totalOccurrences} occurrence{totalOccurrences !== 1 ? 's' : ''} in the Histories
          </h3>

          {Object.entries(occurrencesByBook).map(([bookId, chapters]) => (
            <div key={bookId} style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                {bookTitle(parseInt(bookId))}
              </h4>
              <ul className="occurrence-list">
                {chapters.map(chapter => (
                  <li key={`${bookId}-${chapter}`} className="occurrence-item">
                    <Link to={`/book/${bookId}/chapter/${chapter}`}>
                      Chapter {chapter}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {coOccurringPlaces.length > 0 && (
          <div className="occurrences-section" style={{ marginTop: '2rem' }}>
            <h3>Often mentioned together with</h3>
            <ul className="occurrence-list">
              {coOccurringPlaces.map(coPlace => (
                <li key={coPlace.id} className="occurrence-item">
                  <Link to={`/place/${coPlace.id}`}>
                    {coPlace.name}
                  </Link>
                  <span className="ui-text" style={{ color: 'var(--color-brown-light)', marginLeft: '0.5rem' }}>
                    ({coPlace.coCount} shared chapters)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="place-detail-map">
        {place.lat && place.lng ? (
          <MapContainer
            center={[place.lat, place.lng]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={0.7}
            />

            {/* Show co-occurring places */}
            {coOccurringPlaces.filter(p => p.lat && p.lng).map(coPlace => (
              <CircleMarker
                key={coPlace.id}
                center={[coPlace.lat, coPlace.lng]}
                radius={5}
                pathOptions={{
                  fillColor: '#3a6b7c',
                  fillOpacity: 0.6,
                  color: '#fff',
                  weight: 1
                }}
              >
                <Popup>
                  <div className="popup-place-name">{coPlace.name}</div>
                  <Link
                    to={`/place/${coPlace.id}`}
                    className="ui-text"
                    style={{ fontSize: '0.85rem' }}
                  >
                    View details
                  </Link>
                </Popup>
              </CircleMarker>
            ))}

            {/* Main place marker */}
            <CircleMarker
              center={[place.lat, place.lng]}
              radius={12}
              pathOptions={{
                fillColor: '#c45a3b',
                fillOpacity: 0.9,
                color: '#fff',
                weight: 3
              }}
            >
              <Popup>
                <div className="popup-place-name">{place.name}</div>
                {place.placeType && (
                  <div className="popup-place-type">{place.placeType}</div>
                )}
              </Popup>
            </CircleMarker>
          </MapContainer>
        ) : (
          <div className="loading" style={{ background: 'var(--color-parchment)' }}>
            <p>No coordinates available for this place</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaceDetailView
