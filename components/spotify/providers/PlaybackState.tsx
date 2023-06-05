import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlayer } from './Player';

const PlaybackStateContext = createContext<Spotify.PlaybackState | null | undefined>(undefined);

export const PlaybackStateProvider: React.FC = ({ children }) => {
  const [playbackState, setPlaybackState] = useState<Spotify.PlaybackState | null>(null);
  const player = usePlayer();
  useEffect(() => {
    if (!player) return;

    const intervalId = window.setInterval(async () => {
      const state = await player.getCurrentState();
      setPlaybackState(state);
    }, 100);

    return () => clearInterval(intervalId);
  }, [player]);
  return (
    <PlaybackStateContext.Provider value={playbackState}>{children}</PlaybackStateContext.Provider>
  );
};

export function usePlaybackState() {
  const value = useContext(PlaybackStateContext);
  if (value === undefined) {
    throw new Error('PlaybackStateContext not available');
  }
  return value;
}
