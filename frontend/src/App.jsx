import { useState } from 'react';
import Welcome from './components/Welcome';
import StoryInputs from './components/StoryInputs';
import BookViewer from './components/BookViewer';
import Library from './components/Library';
import './App.css';
import './components/Welcome.css';

function App() {
  const [page, setPage] = useState('welcome');
  const [storyData, setStoryData] = useState(null);

  const goToInputs = () => setPage('inputs');
  const goToWelcome = () => setPage('welcome');
  const goToLibrary = () => setPage('library');
  const goToViewer = (data) => {
    setStoryData(data);
    setPage('viewer');
  };

  return (
    <div className="app">
      {page === 'welcome' && <Welcome onStart={goToInputs} onLibrary={goToLibrary} />}
      {page === 'inputs' && <StoryInputs onBack={goToWelcome} onGenerate={goToViewer} />}
      {page === 'viewer' && (
        <BookViewer
          story={storyData}
          onBack={goToWelcome}
          onStoryComplete={goToLibrary}
        />
      )}
      {page === 'library' && <Library onBack={goToWelcome} onOpenStory={goToViewer} />}
    </div>
  );
}

export default App;
