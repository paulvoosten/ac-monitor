import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlayer } from './Player';

type ErrorState = Spotify.Error & { type: Spotify.ErrorTypes };

const ErrorContext = createContext<ErrorState | null | undefined>(undefined);

export const ErrorProvider: React.FC = ({ children }) => {
  const [error, setError] = useState<ErrorState>();
  const player = usePlayer();
  useEffect(() => {
    if (!player) return;
    const initialization = (error: Spotify.Error) => {
      setError({ ...error, type: 'initialization_error' });
    };
    const authentication = (error: Spotify.Error) => {
      setError({ ...error, type: 'authentication_error' });
    };
    const account = (error: Spotify.Error) => {
      setError({ ...error, type: 'account_error' });
    };
    const playback = (error: Spotify.Error) => {
      setError({ ...error, type: 'playback_error' });
    };
    player.addListener('initialization_error', initialization);
    player.addListener('authentication_error', authentication);
    player.addListener('account_error', account);
    player.addListener('playback_error', playback);
    return () => {
      player.removeListener('initialization_error', initialization);
      player.removeListener('authentication_error', authentication);
      player.removeListener('account_error', account);
      player.removeListener('playback_error', playback);
    };
  }, [player]);
  return (
    <ErrorContext.Provider value={error}>{children}</ErrorContext.Provider>
  );
};

export function useError() {
  const value = useContext(ErrorContext);
  if (value === undefined) throw new Error('ErrorContext not available');
  return value;
}
