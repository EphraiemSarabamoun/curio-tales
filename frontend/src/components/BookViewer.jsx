import { useState, useEffect, useRef } from 'react';
import { generatePage } from '../api';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useTTS } from '../hooks/useTTS';
import './BookViewer.css';

function BookViewer({ story, onBack, onStoryComplete }) {
  const [pages, setPages] = useState(story?.memory?.pages || []);
  const [storyId] = useState(story?.story_id || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null);
  const [continueText, setContinueText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [completed, setCompleted] = useState(story?.memory?.completed || false);
  const [endingPhase, setEndingPhase] = useState(null); // null | 'closing' | 'ended'
  const [coverData, setCoverData] = useState({
    title: story?.memory?.title || '',
    cover_image: story?.memory?.cover_image || '',
  });
  const voice = useVoiceInput();
  const tts = useTTS();
  const hasPlayedFirst = useRef(false);

  useEffect(() => {
    if (voice.transcript) {
      setContinueText(voice.transcript);
    }
  }, [voice.transcript]);

  // Auto-play TTS for the first page on mount
  useEffect(() => {
    if (!hasPlayedFirst.current && pages.length > 0 && pages[0].text) {
      hasPlayedFirst.current = true;
      tts.play(pages[0].text);
    }
  }, []);

  if (!story) return null;

  const page = pages[currentPage];
  const hasNext = currentPage < pages.length - 1;
  const hasPrev = currentPage > 0;
  const isLastPage = currentPage === pages.length - 1;

  const flipPage = (direction) => {
    if (isFlipping) return;
    if (direction === 'next' && !hasNext) return;
    if (direction === 'prev' && !hasPrev) return;

    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => (direction === 'next' ? p + 1 : p - 1));
    }, 300);
    setTimeout(() => {
      setIsFlipping(false);
      setFlipDirection(null);
    }, 600);
  };

  const handleContinue = async () => {
    if (!continueText.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await generatePage({ story_id: storyId, user_action: continueText });
      setPages(res.memory.pages);
      setContinueText('');
      voice.resetTranscript();
      setCurrentPage(res.memory.pages.length - 1);

      if (res.page_text) {
        tts.play(res.page_text);
      }

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
    flipDirection === 'next' && 'open-book--flip-next',
    flipDirection === 'prev' && 'open-book--flip-prev',
    endingPhase === 'closing' && 'open-book--closing',
  ].filter(Boolean).join(' ');

  return (
    <div className="book-viewer">
      <div className="viewer-bg-texture" />

      <button className="viewer-back-float" onClick={onBack}>
        &larr; Back
      </button>

      <div className="book-container">
        <div className="book-scene">
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
            </div>
          </div>
        </div>

        <div className="book-shadow-bottom" />

        <div className="book-page-dots">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`book-dot ${i === currentPage ? 'book-dot--active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="viewer-controls">
        <button
          className={`page-button ${!hasPrev ? 'page-button--disabled' : ''}`}
          onClick={() => flipPage('prev')}
          disabled={!hasPrev}
        >
          &larr;
        </button>

        <button
          className={`page-button page-button--primary ${!hasNext ? 'page-button--disabled' : ''}`}
          onClick={() => flipPage('next')}
          disabled={!hasNext}
        >
          &rarr;
        </button>
      </div>

      {/* Continue story — only on last page of an active story */}
      {isLastPage && !completed && (
        <div className="continue-section">
          <button
            className={`continue-mic-btn ${voice.isListening ? 'continue-mic-btn--listening' : ''}`}
            onClick={() => voice.isListening ? voice.stopListening() : voice.startListening()}
            disabled={isGenerating}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>

          <div className="continue-transcript">
            {continueText && !voice.isListening && (
              <span className="continue-transcript-final">{continueText}</span>
            )}
            {voice.isListening && (
              <span className="continue-transcript-interim">
                {voice.interimTranscript || 'Listening...'}
              </span>
            )}
            {!continueText && !voice.isListening && (
              <span className="continue-transcript-hint">What happens next?</span>
            )}
          </div>

          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={!continueText.trim() || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Continue Story'}
          </button>

          {voice.error && <p className="continue-voice-error">{voice.error}</p>}
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
