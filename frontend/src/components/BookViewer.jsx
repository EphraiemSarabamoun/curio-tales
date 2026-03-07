import { useState } from 'react';
import { generatePage } from '../api';
import './BookViewer.css';

// CSS-only fallback illustrations for pages without an AI-generated image.
const FALLBACK_ILLUSTRATIONS = {
  default: {
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
};

function BookViewer({ story, onBack }) {
  const [pages, setPages] = useState(story?.pages || []);
  const [storyId, setStoryId] = useState(story?.storyId || null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [continueInput, setContinueInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!story) return null;

  const page = pages[currentPage];
  const hasNext = currentPage < pages.length - 1;
  const hasPrev = currentPage > 0;
  const isLastPage = currentPage === pages.length - 1;

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

  const handleContinue = async () => {
    if (!continueInput.trim() || loading) return;
    setLoading(true);
    try {
      const result = await generatePage({
        story_id: storyId,
        user_action: continueInput,
      });
      setStoryId(result.story_id);
      setPages(result.memory.pages.map((p) => ({
        text: p.text,
        image_url: p.image_url,
      })));
      setContinueInput('');
      // Flip to the new page.
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(result.memory.pages.length - 1);
        setIsFlipping(false);
      }, 500);
    } catch (err) {
      console.error('Continue failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine left-page content: AI image or CSS fallback.
  const hasImage = page?.image_url && page.image_url.startsWith('data:');
  const fallback = FALLBACK_ILLUSTRATIONS.default;

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
          Page {currentPage + 1} of {pages.length}
        </span>
      </header>

      <div className="book-container">
        <div className={`open-book ${isFlipping ? 'open-book--flipping' : ''}`}>
          {/* Left page - illustration */}
          <div className="book-page book-page--left">
            {hasImage ? (
              <div className="page-content-illust">
                <img
                  className="page-generated-image"
                  src={page.image_url}
                  alt="Story illustration"
                />
              </div>
            ) : (
              <div className="page-content-illust" style={{ background: fallback.bg }}>
                <div className="illustration-scene">{fallback.elements}</div>
              </div>
            )}
            <div className="page-curl page-curl--left" />
          </div>

          {/* Book spine */}
          <div className="book-spine-center" />

          {/* Right page - text */}
          <div className="book-page book-page--right">
            <div className="page-content-text">
              <div className="page-text-ornament">&#10022;</div>
              <p className="story-text">{page?.text}</p>
              <div className="page-number">{currentPage + 1}</div>
            </div>
            <div className="page-curl page-curl--right" />
          </div>
        </div>

        <div className="book-shadow-bottom" />
      </div>

      {/* Continue input — shown on the last page */}
      {isLastPage && storyId && (
        <div className="continue-section">
          <input
            className="continue-input"
            type="text"
            placeholder="What happens next? (e.g. I open the mysterious door...)"
            value={continueInput}
            onChange={(e) => setContinueInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            disabled={loading}
          />
          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={loading || !continueInput.trim()}
          >
            {loading ? 'Generating...' : 'Continue Story'}
          </button>
        </div>
      )}

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
