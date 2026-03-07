import { useState } from 'react';
import './StoryInputs.css';

const PROMPTS = [
  {
    id: 'who',
    number: '1',
    label: 'WHO',
    description: 'Describe your character',
    placeholder: 'e.g. A brave astronaut named Captain Leo...',
    icon: '&#128100;',
  },
  {
    id: 'where',
    number: '2',
    label: 'WHERE',
    description: 'Set the scene',
    placeholder: 'e.g. In the rings of Saturn, aboard a silver spaceship...',
    icon: '&#127757;',
  },
  {
    id: 'how',
    number: '3',
    label: 'HOW',
    description: 'Choose the ending',
    placeholder: 'e.g. They discover a magical doorway made of starlight...',
    icon: '&#9889;',
  },
];

function WaveformVisualizer({ isActive }) {
  const bars = 24;
  return (
    <div className={`waveform ${isActive ? 'waveform--active' : ''}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{ '--bar-index': i, '--bar-delay': `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}

function StoryInputs({ onBack, onGenerate }) {
  const [inputs, setInputs] = useState({ who: '', where: '', how: '' });
  const [activeRecording, setActiveRecording] = useState(null);

  const handleInputChange = (id, value) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const toggleRecording = (id) => {
    setActiveRecording((prev) => (prev === id ? null : id));
  };

  const handleGenerate = () => {
    onGenerate({
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
    });
  };

  const allFilled = inputs.who && inputs.where && inputs.how;

  return (
    <div className="story-inputs">
      <header className="inputs-header">
        <button className="back-button" onClick={onBack}>
          <span className="back-arrow">&larr;</span>
          <span>Back to Library</span>
        </button>
        <h1 className="inputs-title">Create Your Story</h1>
        <p className="inputs-subtitle">
          Tell us about your adventure using the prompts below
        </p>
      </header>

      <div className="prompts-container">
        {PROMPTS.map((prompt) => (
          <div key={prompt.id} className="prompt-card">
            <div className="prompt-header">
              <div className="prompt-number">{prompt.number}</div>
              <div className="prompt-label-group">
                <span className="prompt-label">{prompt.label}</span>
                <span className="prompt-description">{prompt.description}</span>
              </div>
            </div>

            <div className="prompt-input-area">
              <textarea
                className="prompt-textarea"
                placeholder={prompt.placeholder}
                value={inputs[prompt.id]}
                onChange={(e) => handleInputChange(prompt.id, e.target.value)}
                rows={2}
              />
            </div>

            <div className="prompt-controls">
              <button
                className={`record-button ${activeRecording === prompt.id ? 'record-button--active' : ''}`}
                onClick={() => toggleRecording(prompt.id)}
              >
                <div className="record-dot" />
                <span>{activeRecording === prompt.id ? 'Stop' : 'Record'}</span>
              </button>
              <WaveformVisualizer isActive={activeRecording === prompt.id} />
            </div>
          </div>
        ))}
      </div>

      <div className="generate-section">
        <button
          className={`generate-button ${allFilled ? 'generate-button--ready' : ''}`}
          onClick={handleGenerate}
        >
          <span className="generate-icon">&#10024;</span>
          <span>Generate My Story</span>
        </button>
      </div>
    </div>
  );
}

export default StoryInputs;
