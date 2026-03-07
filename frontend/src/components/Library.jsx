import { useState, useEffect } from 'react';
import { listStories, getStory } from '../api';
import './Library.css';

// Color palette for dynamically-assigned book covers.
const PALETTE = [
  { color: '#1a3a5c', accent: '#4a9eff' },
  { color: '#2d1b4e', accent: '#b088f9' },
  { color: '#4a3728', accent: '#f0a500' },
  { color: '#1b3a3a', accent: '#5ce0d2' },
  { color: '#3a1b2e', accent: '#ff6b9d' },
  { color: '#2e3a1b', accent: '#a8d65c' },
];

function Library({ onAddNew, onSelectBook }) {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    listStories()
      .then(setStories)
      .catch(() => setStories([]));
  }, []);

  const handleSelect = async (s, idx) => {
    try {
      const memory = await getStory(s.story_id);
      onSelectBook({
        title: s.title,
        storyId: s.story_id,
        pages: memory.pages.map((p) => ({
          text: p.text,
          image_url: p.image_url,
        })),
      });
    } catch {
      // If fetch fails, just ignore.
    }
  };

  return (
    <div className="library">
      <header className="library-header">
        <div className="library-header-left">
          <div className="library-logo">
            <span className="logo-icon">&#9733;</span>
            <span className="logo-text">Curio Tales</span>
          </div>
        </div>
        <div className="library-header-right">
          <span className="header-subtitle">My Story Library</span>
        </div>
      </header>

      <div className="library-grid">
        <button className="book-card add-new-card" onClick={onAddNew}>
          <div className="add-new-icon">+</div>
          <span className="add-new-label">ADD NEW STORY</span>
        </button>

        {stories.map((s, idx) => {
          const pal = PALETTE[idx % PALETTE.length];
          return (
            <button
              key={s.story_id}
              className="book-card"
              style={{ '--book-color': pal.color, '--book-accent': pal.accent }}
              onClick={() => handleSelect(s, idx)}
            >
              <div className="book-cover">
                <div className="book-spine" />
                <div className="book-cover-art">
                  <div className="cover-decoration">
                    <div className="cover-circle" />
                    <div className="cover-lines">
                      <div className="cover-line" />
                      <div className="cover-line" />
                      <div className="cover-line" />
                    </div>
                  </div>
                </div>
                <div className="book-info">
                  <h3 className="book-title">{s.title}</h3>
                  <p className="book-author">{s.page_count} pages</p>
                </div>
              </div>
              <div className="book-shadow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Library;
