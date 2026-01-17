function AboutView() {
  return (
    <div className="about-view">
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
  )
}

export default AboutView
