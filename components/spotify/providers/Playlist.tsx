import React, { createContext, useContext, useEffect } from 'react';
import { KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { shuffle } from '../../../helpers/array';
import { getRandomNumber } from '../../../helpers/number';
import Playlist from '../../../interfaces/Playlist';

const PlaylistContext = createContext<
  | {
      data?: Playlist;
      error?: Error;
      loading: boolean;
      mutate: KeyedMutator<Playlist>;
    }
  | undefined
>(undefined);

export const PlaylistProvider: React.FC<{ id: string }> = ({
  id,
  children,
}) => {
  const { data, error, mutate } = useSWRImmutable<Playlist>(
    `/api/spotify/queue/${id}`,
    (url: string) =>
      fetch(url)
        .then((response) => response.json())
        .then((playlist: Playlist) => {
          playlist.tracks = shuffle(playlist.tracks);
          return playlist;
        })
  );
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      mutate(async (data) => {
        if (!data) return data;
        const playlist: Playlist = await fetch(
          `/api/spotify/queue/${data.id}`
        ).then((response) => response.json());
        if ('error' in playlist) return data;
        let queued = data.tracks.findIndex((track) => track.state === 'queued');
        if (queued === -1) queued = 0;
        const currentUris = data.tracks.map((track) => track.uri);
        const newUris: string[] = [];
        playlist.tracks.forEach((track) => {
          newUris.push(track.uri);
          if (!currentUris.includes(track.uri)) {
            data.tracks.splice(
              getRandomNumber(queued, data.tracks.length),
              0,
              track
            );
          }
        });
        return data;
      }, false);
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, [mutate]);
  return (
    <PlaylistContext.Provider
      value={{ data, error, loading: !error && !data, mutate }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export function usePlaylist() {
  const value = useContext(PlaylistContext);
  if (value === undefined) throw new Error('PlaylistProvider not available');
  return value;
}
