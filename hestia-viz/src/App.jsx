import { Routes, Route, Link, useLocation } from 'react-router-dom'
import SummaryView from './components/SummaryView'
import ReadingView from './components/ReadingView'
import PlaceDetailView from './components/PlaceDetailView'
import AboutView from './components/AboutView'
import { booksIndex, places, bookTexts } from './data'

function App() {
  const location = useLocation()
  const placesData = places.places

  const isHome = location.pathname === '/' || location.pathname === ''
  const isAbout = location.pathname === '/about'

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Hestia<span>Viz</span> <span className="redux-tag">Redux</span>
          </Link>
        </h1>
        <nav className="ui-text">
          <Link to="/" className={isHome ? 'active' : ''}>
            Books
          </Link>
          <Link to="/about" className={isAbout ? 'active' : ''}>
            About
          </Link>
          <a
            href="https://pleiades.stoa.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pleiades
          </a>
          <a
            href="https://recogito.pelagios.org/document/tjrrsqn4dwmgep"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <SummaryView
                booksIndex={booksIndex}
                placesData={placesData}
              />
            }
          />
          <Route
            path="/about"
            element={<AboutView />}
          />
          <Route
            path="/book/:bookId"
            element={
              <ReadingView
                booksIndex={booksIndex}
                placesData={placesData}
                bookTexts={bookTexts}
              />
            }
          />
          <Route
            path="/book/:bookId/chapter/:chapterId"
            element={
              <ReadingView
                booksIndex={booksIndex}
                placesData={placesData}
                bookTexts={bookTexts}
              />
            }
          />
          <Route
            path="/place/:placeId"
            element={
              <PlaceDetailView
                placesData={placesData}
                booksIndex={booksIndex}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
