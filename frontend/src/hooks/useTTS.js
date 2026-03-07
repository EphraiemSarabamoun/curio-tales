import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchTTS } from '../api';

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(async (text) => {
    if (!text) return;

    stop();
    setError(null);
    setIsLoading(true);

    try {
      const blob = await fetchTTS(text);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Audio playback failed');
      };

      await audio.play();
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { isPlaying, isLoading, error, play, stop };
}
