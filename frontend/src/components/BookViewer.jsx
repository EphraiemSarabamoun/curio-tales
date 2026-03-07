import { useState, useEffect } from 'react';
import { generatePage } from '../api';
import './BookViewer.css';

function BookViewer({ story, onBack, onStoryComplete }) {
  const [pages, setPages] = useState(story?.memory?.pages || []);
  const [storyId] = useState(story?.story_id || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [continueText, setContinueText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [completed, setCompleted] = useState(story?.memory?.completed || false);
  const [endingPhase, setEndingPhase] = useState(null); // null | 'closing' | 'ended'
  const [coverData, setCoverData] = useState({
    title: story?.memory?.title || '',
    cover_image: story?.memory?.cover_image || '',
  });

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

      if (res.story_complete) {
        setCompleted(true);
        setCoverData({
          title: res.memory.title || '',
          cover_image: res.memory.cover_image || '',
        });
        setTimeout(() => setEndingPhase('closing'), 2000);
        setTimeout(() => setEndingPhase('ended'), 3500);
      }
    } catch (err) {
      console.error('Continue failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoToLibrary = () => {
    if (onStoryComplete) onStoryComplete();
  };

  const title = coverData.title || story.memory?.theme_and_style || 'Your Story';

  // --- Completion screen ---
  if (endingPhase === 'ended') {
    return (
      <div className="book-viewer">
        <div className="viewer-bg-texture" />
        <div className="completion-screen">
          <div className="completion-cover">
            {coverData.cover_image ? (
              <img
                className="cover-image"
                src={coverData.cover_image}
                alt="Story cover"
              />
            ) : (
              <div className="cover-fallback">
                <div className="illust-stars" />
              </div>
            )}
            <div className="cover-title-overlay">
              <h2 className="cover-title">{coverData.title || 'Your Story'}</h2>
            </div>
          </div>
          <p className="completion-label">The End</p>
          <button className="completion-button" onClick={handleGoToLibrary}>
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  const bookClass = [
    'open-book',
    isFlipping && 'open-book--flipping',
    endingPhase === 'closing' && 'open-book--closing',
  ].filter(Boolean).join(' ');

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
        <div className={bookClass}>
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

      {/* Continue story — only on last page of an active story */}
      {isLastPage && !completed && (
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

      {/* Completed story — viewed from library */}
      {isLastPage && completed && !endingPhase && (
        <div className="story-ended-bar">
          <span className="ended-label">The End</span>
          <button className="completion-button" onClick={handleGoToLibrary}>
            Go to Library
          </button>
        </div>
      )}
    </div>
  );
}

export default BookViewer;
