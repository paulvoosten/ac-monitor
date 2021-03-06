import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlayer } from './Player';

const PlaybackStateContext = createContext<Spotify.PlaybackState | null | undefined>(undefined);

export const PlaybackStateProvider: React.FC = ({ children }) => {
  const [playbackState, setPlaybackState] = useState<Spotify.PlaybackState | null>(null);
  const player = usePlayer();
  useEffect(() => {
    if (!player) return;
    const playerStateChanged = (state: Spotify.PlaybackState) => {
      setPlaybackState(state);
    };
    player.addListener('player_state_changed', playerStateChanged);
    return () => player.removeListener('player_state_changed', playerStateChanged);
  }, [player]);
  return (
    <PlaybackStateContext.Provider value={playbackState}>{children}</PlaybackStateContext.Provider>
  );
};

export function usePlaybackState(interval: false | number = false) {
  const value = useContext(PlaybackStateContext);
  if (value === undefined) {
    throw new Error('PlaybackStateContext not available');
  }
  const [playbackState, setPlaybackState] = useState(value);
  const player = usePlayer();
  useEffect(() => setPlaybackState(value), [value]);
  const playbackStateIsNull = playbackState === null;
  useEffect(() => {
    if (interval === false || !player || playbackStateIsNull || playbackState.paused) {
      return;
    }
    const intervalId = window.setInterval(async () => {
      const state = await player.getCurrentState();
      setPlaybackState(state);
    }, interval);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [interval, player, playbackStateIsNull, playbackState?.paused]);

  return playbackState;
}
