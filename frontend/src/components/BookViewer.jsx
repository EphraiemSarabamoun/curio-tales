import { useState } from 'react';
import { generatePage } from '../api';
import './BookViewer.css';

function BookViewer({ story, onBack }) {
  const [pages, setPages] = useState(story?.memory?.pages || []);
  const [storyId] = useState(story?.story_id || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [continueText, setContinueText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (!continueText.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await generatePage({ story_id: storyId, user_action: continueText });
      setPages(res.memory.pages);
      setContinueText('');
      setCurrentPage(res.memory.pages.length - 1);
    } catch (err) {
      console.error('Continue failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const title = story.memory?.theme_and_style || 'Your Story';

  return (
    <div className="book-viewer">
      <div className="viewer-bg-texture" />

      <header className="viewer-header">
        <button className="back-button" onClick={onBack}>
          <span className="back-arrow">&larr;</span>
          <span>Back</span>
        </button>
        <h1 className="viewer-title">{title}</h1>
        <span className="page-indicator">
          Page {currentPage + 1} of {pages.length}
        </span>
      </header>

      <div className="book-container">
        <div className={`open-book ${isFlipping ? 'open-book--flipping' : ''}`}>
          {/* Left page - illustration */}
          <div className="book-page book-page--left">
            {page.image_url ? (
              <img
                className="page-generated-image"
                src={page.image_url}
                alt="Story illustration"
              />
            ) : (
              <div
                className="page-content-illust"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}
              >
                <div className="illustration-scene">
                  <div className="illust-stars" />
                </div>
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

        <button
          className={`page-button page-button--primary ${!hasNext ? 'page-button--disabled' : ''}`}
          onClick={() => flipPage('next')}
          disabled={!hasNext}
        >
          Next &rarr;
        </button>
      </div>

      {isLastPage && (
        <div className="continue-section">
          <input
            className="continue-input"
            type="text"
            placeholder="What happens next?"
            value={continueText}
            onChange={(e) => setContinueText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            disabled={isGenerating}
          />
          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={!continueText.trim() || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Continue Story'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BookViewer;
