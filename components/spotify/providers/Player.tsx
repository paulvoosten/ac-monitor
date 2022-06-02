import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSDK } from './SDK';

const PlayerContext = createContext<Spotify.Player | null | undefined>(undefined);

export const PlayerProvider: React.FC<{
  getOAuthToken: Spotify.PlayerInit['getOAuthToken'];
  name: Spotify.PlayerInit['name'];
  volume?: Spotify.PlayerInit['volume'];
  connectOnInit: boolean;
}> = ({ children, getOAuthToken, name, volume, connectOnInit }) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const sdkReady = useSDK();
  const getOAuthTokenRef = useRef(getOAuthToken);
  getOAuthTokenRef.current = getOAuthToken;
  useEffect(() => {
    if (sdkReady) {
      const player = new Spotify.Player({
        getOAuthToken: callback => getOAuthTokenRef.current(callback),
        name,
        volume,
      });
      setPlayer(player);
      if (connectOnInit) player.connect();
      return () => player.disconnect();
    }
  }, [connectOnInit, sdkReady]); // eslint-disable-line react-hooks/exhaustive-deps
  return <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>;
};

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (value === undefined) throw new Error('PlayerContext not available');
  return value;
}
