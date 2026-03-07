import { useState, useEffect } from 'react';
import { listStories, getStory } from '../api';
import './Library.css';

function Library({ onBack, onOpenStory }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStories()
      .then(setStories)
      .catch((err) => console.error('Failed to load stories:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = async (storyId) => {
    try {
      const memory = await getStory(storyId);
      onOpenStory({ story_id: storyId, memory });
    } catch (err) {
      console.error('Failed to load story:', err);
    }
  };

  return (
    <div className="library-page">
      <header className="library-header">
        <button className="library-back" onClick={onBack}>
          <span>&larr;</span> Back
        </button>
        <h1 className="library-title">My Library</h1>
      </header>

      {loading && <p className="library-loading">Loading stories...</p>}

      {!loading && stories.length === 0 && (
        <p className="library-empty">No stories yet. Go create one!</p>
      )}

      <div className="library-grid">
        {stories.map((s) => (
          <button key={s.story_id} className="library-card" onClick={() => handleOpen(s.story_id)}>
            <div className="card-cover">
              {s.cover_image ? (
                <img className="card-cover-img" src={s.cover_image} alt="" />
              ) : (
                <div className="card-cover-fallback">
                  <div className="illust-stars" />
                </div>
              )}
              {s.completed && <span className="card-badge">Complete</span>}
            </div>
            <div className="card-info">
              <h3 className="card-title">{s.title}</h3>
              <span className="card-pages">{s.page_count} pages</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Library;
