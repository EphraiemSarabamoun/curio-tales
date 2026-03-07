import { useState } from 'react';
import './Library.css';

const BOOKS = [
  {
    id: 1,
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    color: '#1a3a5c',
    accent: '#4a9eff',
  },
  {
    id: 2,
    title: 'The Midnight Library',
    author: 'Matt Haig',
    color: '#2d1b4e',
    accent: '#b088f9',
  },
  {
    id: 3,
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    color: '#4a3728',
    accent: '#f0a500',
  },
  {
    id: 4,
    title: 'Piranesi',
    author: 'Susanna Clarke',
    color: '#1b3a3a',
    accent: '#5ce0d2',
  },
  {
    id: 5,
    title: 'The Invisible Life of Addie LaRue',
    author: 'V.E. Schwab',
    color: '#3a1b2e',
    accent: '#ff6b9d',
  },
  {
    id: 6,
    title: 'Anxious People',
    author: 'Fredrik Backman',
    color: '#2e3a1b',
    accent: '#a8d65c',
  },
];

const sampleStory = {
  title: 'Captain Leo\'s Space Adventure',
  illustration: 'astronaut',
  pages: [
    {
      text: 'Our hero, Captain Leo, floated through the endless void of space. Stars twinkled like diamonds scattered across black velvet, and the great blue marble of Earth shrank behind him.',
      illustration: 'astronaut',
    },
    {
      text: 'His ship, The Curious Fox, hummed gently as it carried him toward the mysterious signal coming from the rings of Saturn. "What could be out there?" Leo wondered aloud.',
      illustration: 'spaceship',
    },
    {
      text: '"Mission Control, I\'m approaching the source," Leo radioed back. The signal grew stronger, pulsing like a heartbeat. Then, through the golden rings, he saw it -- a doorway made of light.',
      illustration: 'saturn',
    },
  ],
};

function Library({ onAddNew, onSelectBook }) {
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

        {BOOKS.map((book) => (
          <button
            key={book.id}
            className="book-card"
            style={{ '--book-color': book.color, '--book-accent': book.accent }}
            onClick={() => onSelectBook(sampleStory)}
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
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author}</p>
              </div>
            </div>
            <div className="book-shadow" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default Library;
