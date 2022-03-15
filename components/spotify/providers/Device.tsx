import { createContext, useContext, useEffect, useState } from 'react';
import { usePlayer } from './Player';

type Device = {
  id: string;
  ready: boolean;
};

const DeviceContext = createContext<Device | null | undefined>(undefined);

export const DeviceProvider: React.FC = ({ children }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const player = usePlayer();
  useEffect(() => {
    if (!player) {
      return;
    }
    const ready = ({ device_id }: Spotify.WebPlaybackInstance) => {
      setDevice({ id: device_id, ready: true });
    };
    const notReady = ({ device_id }: Spotify.WebPlaybackInstance) => {
      setDevice({ id: device_id, ready: false });
    };
    player.addListener('ready', ready);
    player.addListener('not_ready', notReady);
    return () => {
      player.removeListener('ready', ready);
      player.removeListener('not_ready', notReady);
    };
  }, [player]);
  return (
    <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>
  );
};

export function useDevice() {
  const value = useContext(DeviceContext);
  if (value === undefined) {
    throw new Error('DeviceContext not available');
  }
  return value;
}
