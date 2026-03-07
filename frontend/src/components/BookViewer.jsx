import { useState } from 'react';
import './BookViewer.css';

const ILLUSTRATIONS = {
  astronaut: {
    bg: 'linear-gradient(135deg, #0a0e27 0%, #1a1a4e 40%, #2d1b69 100%)',
    elements: (
      <>
        <div className="illust-stars" />
        <div className="illust-planet" />
        <div className="illust-astronaut">
          <div className="astronaut-helmet" />
          <div className="astronaut-body" />
          <div className="astronaut-pack" />
          <div className="astronaut-visor" />
        </div>
        <div className="illust-earth" />
      </>
    ),
  },
  spaceship: {
    bg: 'linear-gradient(135deg, #0d1117 0%, #161b33 40%, #1a2744 100%)',
    elements: (
      <>
        <div className="illust-stars" />
        <div className="illust-ship">
          <div className="ship-body" />
          <div className="ship-wing ship-wing--left" />
          <div className="ship-wing ship-wing--right" />
          <div className="ship-flame" />
        </div>
        <div className="illust-nebula" />
      </>
    ),
  },
  saturn: {
    bg: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 40%, #2a1a3e 100%)',
    elements: (
      <>
        <div className="illust-stars" />
        <div className="illust-saturn">
          <div className="saturn-body" />
          <div className="saturn-ring" />
        </div>
        <div className="illust-portal" />
      </>
    ),
  },
};

function BookViewer({ story, onBack }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  if (!story) return null;

  const page = story.pages[currentPage];
  const illust = ILLUSTRATIONS[page.illustration] || ILLUSTRATIONS.astronaut;
  const hasNext = currentPage < story.pages.length - 1;
  const hasPrev = currentPage > 0;

  const flipPage = (direction) => {
    if (isFlipping) return;
    if (direction === 'next' && !hasNext) return;
    if (direction === 'prev' && !hasPrev) return;

    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => (direction === 'next' ? p + 1 : p - 1));
      setIsFlipping(false);
    }, 500);
  };

  return (
    <div className="book-viewer">
      <div className="viewer-bg-texture" />

      <header className="viewer-header">
        <button className="back-button" onClick={onBack}>
          <span className="back-arrow">&larr;</span>
          <span>Back to Library</span>
        </button>
        <h1 className="viewer-title">{story.title}</h1>
        <span className="page-indicator">
          Page {currentPage + 1} of {story.pages.length}
        </span>
      </header>

      <div className="book-container">
        <div className={`open-book ${isFlipping ? 'open-book--flipping' : ''}`}>
          {/* Left page - illustration */}
          <div className="book-page book-page--left">
            <div className="page-content-illust" style={{ background: illust.bg }}>
              <div className="illustration-scene">{illust.elements}</div>
            </div>
            <div className="page-curl page-curl--left" />
          </div>

          {/* Book spine */}
          <div className="book-spine-center" />

          {/* Right page - text */}
          <div className="book-page book-page--right">
            <div className="page-content-text">
              <div className="page-text-ornament">&#10022;</div>
              <p className="story-text">{page.text}</p>
              <div className="page-number">{currentPage + 1}</div>
            </div>
            <div className="page-curl page-curl--right" />
          </div>
        </div>

        <div className="book-shadow-bottom" />
      </div>

      <div className="viewer-controls">
        <button
          className={`page-button ${!hasPrev ? 'page-button--disabled' : ''}`}
          onClick={() => flipPage('prev')}
          disabled={!hasPrev}
        >
          &larr; Previous
        </button>

        <div className="audio-controls">
          <button className="audio-play-btn">
            <div className="play-icon" />
          </button>
          <span className="audio-label">Listen to Story</span>
        </div>

        <button
          className={`page-button page-button--primary ${!hasNext ? 'page-button--disabled' : ''}`}
          onClick={() => flipPage('next')}
          disabled={!hasNext}
        >
          Leaf Over &rarr;
        </button>
      </div>
    </div>
  );
}

export default BookViewer;
