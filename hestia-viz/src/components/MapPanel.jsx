import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@maplibre/maplibre-gl-leaflet'

const { BaseLayer } = LayersControl

// Helper to get appropriate place name based on language
function getPlaceName(place, useGreek = false) {
  if (!useGreek) return place.name

  // Extract Greek transliteration if available (after slash)
  // e.g., "Halicarnassus/Halikarnassos" -> "Halikarnassos"
  if (place.name.includes('/')) {
    const parts = place.name.split('/')
    return parts[1].trim()
  }

  return place.name
}

// Helper to determine place category
function getPlaceCategory(place) {
  const placeType = (place.placeType || '').toLowerCase()

  // Rivers and water features
  if (placeType.includes('river') || placeType.includes('stream')) {
    return 'river'
  }

  // Regions, provinces, peoples, ethnics
  if (place.isEthnic ||
      placeType.includes('region') ||
      placeType.includes('province') ||
      placeType.includes('people') ||
      placeType.includes('satrapy')) {
    return 'region'
  }

  // Water bodies (seas, lakes)
  if (placeType.includes('water-open') || placeType.includes('lake') || placeType.includes('mare')) {
    return 'water'
  }

  // Mountains
  if (placeType.includes('mountain')) {
    return 'mountain'
  }

  // Default: settlement/point
  return 'settlement'
}

// Component to handle map view changes
function MapController({ selectedPlace, placesData }) {
  const map = useMap()

  useEffect(() => {
    if (selectedPlace && placesData?.[selectedPlace]) {
      const place = placesData[selectedPlace]
      if (place.lat && place.lng) {
        map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 6), {
          duration: 0.5
        })
      }
    }
  }, [selectedPlace, placesData, map])

  return null
}

// Component to handle base layer changes
function LayerChangeHandler({ onLayerChange }) {
  const map = useMap()

  useEffect(() => {
    const handleBaseLayerChange = (e) => {
      const layerName = e.name.toLowerCase()
      if (layerName.includes('satellite')) {
        onLayerChange('satellite')
      } else if (layerName.includes('political')) {
        onLayerChange('political')
      } else if (layerName.includes('cawm')) {
        onLayerChange('cawm')
      }
    }

    map.on('baselayerchange', handleBaseLayerChange)

    return () => {
      map.off('baselayerchange', handleBaseLayerChange)
    }
  }, [map, onLayerChange])

  return null
}

// Component to add OpenHistoricalMap vector tiles with temporal filtering using MapLibre GL
function TemporalMapLayer({ dateRange, isActive }) {
  const map = useMap()

  useEffect(() => {
    if (!isActive || !dateRange) return

    console.log('Date range for filtering:', dateRange)

    const rangeStart = dateRange.start
    const rangeEnd = dateRange.end

    // Create MapLibre GL style specification for OHM tiles
    const style = {
      version: 8,
      sources: {
        'ohm': {
          type: 'vector',
          tiles: ['https://vtiles.openhistoricalmap.org/maps/osm/{z}/{x}/{y}.pbf'],
          maxzoom: 14
        }
      },
      layers: [
        {
          id: 'boundaries-temporal',
          type: 'line',
          source: 'ohm',
          'source-layer': 'boundary',
          filter: [
            'all',
            // Feature must have temporal data
            ['has', 'start_decdate'],
            ['has', 'end_decdate'],
            // Feature must overlap with our date range
            // start_decdate <= rangeEnd AND end_decdate >= rangeStart
            ['<=', ['get', 'start_decdate'], rangeEnd],
            ['>=', ['get', 'end_decdate'], rangeStart]
          ],
          paint: {
            'line-color': '#8b7355',
            'line-width': 2,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2]
          }
        }
      ]
    }

    console.log('Creating MapLibre GL layer with style:', style)

    // Create MapLibre GL layer using L.maplibreGL
    const maplibreLayer = L.maplibreGL({
      style: style,
      pane: 'tilePane' // Use existing pane
    })

    maplibreLayer.addTo(map)
    console.log('MapLibre GL layer added to map')

    // Log when style loads
    if (maplibreLayer._glMap) {
      maplibreLayer._glMap.on('load', () => {
        console.log('MapLibre GL style loaded successfully')
      })

      maplibreLayer._glMap.on('error', (e) => {
        console.error('MapLibre GL error:', e)
      })
    }

    // Cleanup function to remove layer when component unmounts or becomes inactive
    return () => {
      map.removeLayer(maplibreLayer)
    }
  }, [map, dateRange, isActive])

  return null
}

// Text label component for regions/ethnoi - improved readability
function RegionLabel({ place, isMemory, opacity = 1, onClick, language }) {
  const icon = useMemo(() => {
    const placeName = getPlaceName(place, language === 'greek')
    const name = placeName.replace(/\s*\([^)]*\)\s*/g, '').trim()
    const fontSize = isMemory ? '13px' : '15px'
    const baseOpacity = isMemory ? opacity * 0.85 : 1

    return L.divIcon({
      className: 'region-label',
      html: `<span style="
        font-family: 'Source Sans Pro', sans-serif;
        font-size: ${fontSize};
        font-weight: 700;
        color: rgba(101, 67, 33, ${baseOpacity});
        text-transform: uppercase;
        letter-spacing: 0.2em;
        white-space: nowrap;
        text-shadow:
          -1px -1px 0 rgba(255,255,255,0.95),
          1px -1px 0 rgba(255,255,255,0.95),
          -1px 1px 0 rgba(255,255,255,0.95),
          1px 1px 0 rgba(255,255,255,0.95),
          0 0 8px rgba(255,255,255,0.9),
          0 0 12px rgba(255,255,255,0.7);
        cursor: pointer;
        padding: 2px 4px;
      ">${name}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    })
  }, [place.name, isMemory, opacity, language])

  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(place.id)
      }}
    >
      <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
        <div className="popup-place-name">{getPlaceName(place, language === 'greek')}</div>
        {place.placeType && (
          <div className="popup-place-type">{place.placeType}</div>
        )}
        {place.isEthnic && (
          <div className="popup-place-type" style={{ fontStyle: 'italic' }}>ethnic/people group</div>
        )}
      </Tooltip>
    </Marker>
  )
}

// Water body label (seas, lakes) - italic serif style
function WaterLabel({ place, isMemory, opacity = 1, onClick, language }) {
  const icon = useMemo(() => {
    const placeName = getPlaceName(place, language === 'greek')
    const name = placeName.replace(/\s*\([^)]*\)\s*/g, '').trim()
    const fontSize = isMemory ? '14px' : '16px'
    const baseOpacity = isMemory ? opacity * 0.8 : 0.95

    return L.divIcon({
      className: 'water-label',
      html: `<span style="
        font-family: 'Crimson Text', Georgia, serif;
        font-size: ${fontSize};
        font-style: italic;
        font-weight: 400;
        color: rgba(30, 64, 120, ${baseOpacity});
        letter-spacing: 0.08em;
        white-space: nowrap;
        text-shadow:
          -1px -1px 0 rgba(255,255,255,0.95),
          1px -1px 0 rgba(255,255,255,0.95),
          -1px 1px 0 rgba(255,255,255,0.95),
          1px 1px 0 rgba(255,255,255,0.95),
          0 0 10px rgba(255,255,255,0.9),
          0 0 15px rgba(255,255,255,0.8);
        cursor: pointer;
        padding: 2px 4px;
      ">${name}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    })
  }, [place.name, isMemory, opacity, language])

  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(place.id)
      }}
    >
      <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
        <div className="popup-place-name" style={{ color: '#1e4078' }}>{getPlaceName(place, language === 'greek')}</div>
        {place.placeType && (
          <div className="popup-place-type">{place.placeType}</div>
        )}
      </Tooltip>
    </Marker>
  )
}

// River marker - blue circle
function RiverMarker({ place, isMemory, opacity = 1, isSelected, onClick, language }) {
  const baseColor = '#2563eb'
  const selectedColor = '#60a5fa'
  const color = isSelected ? selectedColor : baseColor
  const fillOpacity = isMemory ? opacity * 0.6 : 0.85

  return (
    <CircleMarker
      center={[place.lat, place.lng]}
      radius={isSelected ? 8 : 5}
      pathOptions={{
        fillColor: color,
        fillOpacity: fillOpacity,
        color: '#fff',
        weight: isSelected ? 2 : 1.5,
        opacity: isMemory ? opacity : 1
      }}
      eventHandlers={{
        click: () => onClick(place.id)
      }}
    >
      <Tooltip direction="top" offset={[0, -5]} opacity={0.95} sticky>
        <div className="popup-place-name" style={{ color: baseColor }}>{getPlaceName(place, language === 'greek')}</div>
        <div className="popup-place-type">river</div>
        {isMemory && place.memoryChapter && (
          <div className="popup-place-type ui-text" style={{ fontSize: '0.75rem' }}>
            from chapter {place.memoryChapter}
          </div>
        )}
      </Tooltip>
    </CircleMarker>
  )
}

// Mountain marker - gray
function MountainMarker({ place, isMemory, opacity = 1, isSelected, onClick, language }) {
  const baseColor = '#78716c'
  const fillOpacity = isMemory ? opacity * 0.6 : 0.8

  return (
    <CircleMarker
      center={[place.lat, place.lng]}
      radius={isSelected ? 8 : 6}
      pathOptions={{
        fillColor: isSelected ? '#a8a29e' : baseColor,
        fillOpacity: fillOpacity,
        color: '#fff',
        weight: isSelected ? 2 : 1.5,
        opacity: isMemory ? opacity : 1
      }}
      eventHandlers={{
        click: () => onClick(place.id)
      }}
    >
      <Tooltip direction="top" offset={[0, -5]} opacity={0.95} sticky>
        <div className="popup-place-name">{getPlaceName(place, language === 'greek')}</div>
        <div className="popup-place-type">mountain</div>
      </Tooltip>
    </CircleMarker>
  )
}

// Default settlement marker
function SettlementMarker({ place, isMemory, opacity = 1, isSelected, onClick, memoryChapter, language }) {
  const currentColor = '#c45a3b'
  const memoryColor = '#3a6b7c'
  const selectedColor = '#b8973b'

  let fillColor = isMemory ? memoryColor : currentColor
  if (isSelected) fillColor = selectedColor

  const fillOpacity = isMemory ? opacity * 0.7 : 0.9

  return (
    <CircleMarker
      center={[place.lat, place.lng]}
      radius={isSelected ? 10 : 7}
      pathOptions={{
        fillColor,
        fillOpacity,
        color: '#fff',
        weight: isSelected ? 3 : 2,
        opacity: isMemory ? opacity : 1
      }}
      eventHandlers={{
        click: () => onClick(place.id)
      }}
    >
      <Tooltip direction="top" offset={[0, -5]} opacity={0.95} sticky>
        <div className="popup-place-name">{getPlaceName(place, language === 'greek')}</div>
        {place.placeType && (
          <div className="popup-place-type">{place.placeType}</div>
        )}
        {isMemory && memoryChapter && (
          <div className="popup-place-type ui-text" style={{ fontSize: '0.75rem' }}>
            from chapter {memoryChapter}
          </div>
        )}
      </Tooltip>
    </CircleMarker>
  )
}

function MapPanel({
  currentPlaces,
  memoryPlaces,
  selectedPlace,
  placesData,
  onPlaceClick,
  currentChapter,
  language,
  bookInfo
}) {
  // Track which base layer is active
  const [activeBaseLayer, setActiveBaseLayer] = useState('satellite')

  // Categorize places
  const categorizedCurrent = useMemo(() => {
    const result = { regions: [], rivers: [], water: [], mountains: [], settlements: [] }
    currentPlaces.forEach(place => {
      const category = getPlaceCategory(place)
      if (category === 'region') result.regions.push(place)
      else if (category === 'river') result.rivers.push(place)
      else if (category === 'water') result.water.push(place)
      else if (category === 'mountain') result.mountains.push(place)
      else result.settlements.push(place)
    })
    return result
  }, [currentPlaces])

  const categorizedMemory = useMemo(() => {
    const result = { regions: [], rivers: [], water: [], mountains: [], settlements: [] }
    memoryPlaces.forEach(place => {
      const category = getPlaceCategory(place)
      if (category === 'region') result.regions.push(place)
      else if (category === 'river') result.rivers.push(place)
      else if (category === 'water') result.water.push(place)
      else if (category === 'mountain') result.mountains.push(place)
      else result.settlements.push(place)
    })
    return result
  }, [memoryPlaces])

  return (
    <div className="map-panel">
      <MapContainer
        center={[38, 28]}
        zoom={5}
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

        <MapController
          selectedPlace={selectedPlace}
          placesData={placesData}
        />

        <LayerChangeHandler onLayerChange={setActiveBaseLayer} />

        {/* Temporal vector tiles layer - overlay on CAWM layer */}
        <TemporalMapLayer
          dateRange={bookInfo?.dateRange}
          isActive={activeBaseLayer === 'cawm'}
        />

        {/* Memory rivers */}
        {categorizedMemory.rivers.map(place => (
          <RiverMarker
            key={`memory-river-${place.id}`}
            place={place}
            isMemory={true}
            opacity={place.opacity}
            isSelected={selectedPlace === place.id}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Memory mountains */}
        {categorizedMemory.mountains.map(place => (
          <MountainMarker
            key={`memory-mountain-${place.id}`}
            place={place}
            isMemory={true}
            opacity={place.opacity}
            isSelected={selectedPlace === place.id}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Memory settlements */}
        {categorizedMemory.settlements.map(place => (
          <SettlementMarker
            key={`memory-settlement-${place.id}`}
            place={place}
            isMemory={true}
            opacity={place.opacity}
            isSelected={selectedPlace === place.id}
            onClick={onPlaceClick}
            memoryChapter={place.memoryChapter}
            language={language}
          />
        ))}

        {/* Current rivers */}
        {categorizedCurrent.rivers.map(place => (
          <RiverMarker
            key={`current-river-${place.id}`}
            place={place}
            isMemory={false}
            isSelected={selectedPlace === place.id}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Current mountains */}
        {categorizedCurrent.mountains.map(place => (
          <MountainMarker
            key={`current-mountain-${place.id}`}
            place={place}
            isMemory={false}
            isSelected={selectedPlace === place.id}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Current settlements */}
        {categorizedCurrent.settlements.map(place => (
          <SettlementMarker
            key={`current-settlement-${place.id}`}
            place={place}
            isMemory={false}
            isSelected={selectedPlace === place.id}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Labels rendered last (on top) */}

        {/* Memory water labels */}
        {categorizedMemory.water.map(place => (
          <WaterLabel
            key={`memory-water-${place.id}`}
            place={place}
            isMemory={true}
            opacity={place.opacity}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Memory region labels */}
        {categorizedMemory.regions.map(place => (
          <RegionLabel
            key={`memory-region-${place.id}`}
            place={place}
            isMemory={true}
            opacity={place.opacity}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Current water labels */}
        {categorizedCurrent.water.map(place => (
          <WaterLabel
            key={`current-water-${place.id}`}
            place={place}
            isMemory={false}
            onClick={onPlaceClick}
            language={language}
          />
        ))}

        {/* Current region labels */}
        {categorizedCurrent.regions.map(place => (
          <RegionLabel
            key={`current-region-${place.id}`}
            place={place}
            isMemory={false}
            onClick={onPlaceClick}
            language={language}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="memory-legend">
        <h4>Place Types</h4>
        <div className="legend-item">
          <span className="legend-dot current" />
          <span>Settlement</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#2563eb' }} />
          <span>River</span>
        </div>
        <div className="legend-item">
          <span style={{
            fontFamily: 'Crimson Text, Georgia, serif',
            fontSize: '0.7rem',
            fontStyle: 'italic',
            color: '#1e4078'
          }}>Sea Name</span>
        </div>
        <div className="legend-item">
          <span style={{
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: '0.6rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#654321'
          }}>REGION</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot memory" />
          <span>From prev. chapters</span>
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-brown-light)' }}>
          Ch. {currentChapter} · {currentPlaces.length} places
        </p>
      </div>
    </div>
  )
}

export default MapPanel
