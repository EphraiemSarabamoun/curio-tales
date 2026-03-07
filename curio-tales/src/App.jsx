import { useState } from 'react';
import Library from './components/Library';
import StoryInputs from './components/StoryInputs';
import BookViewer from './components/BookViewer';
import './App.css';

function App() {
  const [page, setPage] = useState('library');
  const [storyData, setStoryData] = useState(null);

  const goToInputs = () => setPage('inputs');
  const goToLibrary = () => setPage('library');
  const goToViewer = (data) => {
    setStoryData(data);
    setPage('viewer');
  };

  return (
    <div className="app">
      {page === 'library' && <Library onAddNew={goToInputs} onSelectBook={goToViewer} />}
      {page === 'inputs' && <StoryInputs onBack={goToLibrary} onGenerate={goToViewer} />}
      {page === 'viewer' && <BookViewer story={storyData} onBack={goToLibrary} />}
    </div>
  );
}

export default App;
