import React, { createContext, useContext, useEffect, useState } from 'react';
import { DeviceProvider } from './Device';
import { ErrorProvider } from './Error';
import { PlaybackStateProvider } from './PlaybackState';
import { PlayerProvider } from './Player';

const SDKContext = createContext<boolean | undefined>(undefined);

export const SDKProvider: React.FC<{
  getOAuthToken: Spotify.PlayerInit['getOAuthToken'];
  name: Spotify.PlayerInit['name'];
  volume: Spotify.PlayerInit['volume'];
}> = ({ children, getOAuthToken, name, volume }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => setReady(true);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <SDKContext.Provider value={ready}>
      <PlayerProvider getOAuthToken={getOAuthToken} name={name} volume={volume}>
        <DeviceProvider>
          <PlaybackStateProvider>
            <ErrorProvider>{children}</ErrorProvider>
          </PlaybackStateProvider>
        </DeviceProvider>
      </PlayerProvider>
    </SDKContext.Provider>
  );
};

export function useSDK() {
  const value = useContext(SDKContext);
  if (value === undefined) throw new Error('SDKContext not available');
  return value;
}
