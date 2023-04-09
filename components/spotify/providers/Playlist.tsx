import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { shuffle } from '../../../helpers/array';
import Playlist from '../../../interfaces/Playlist';
import { useDevice } from './Device';
import { useSession } from 'next-auth/react';
import { usePlaybackState } from './PlaybackState';

export const QUEUE_SIZE = 100;

const PlaylistContext = createContext<
  | {
      data?: Playlist;
      error?: Error;
      loading: boolean;
      mutate: KeyedMutator<Playlist>;
      playTrack: (uris: string[], position_ms: number) => void;
      setPosition: (position: number) => void;
    }
  | undefined
>(undefined);

export const PlaylistProvider: React.FC<{ id: string }> = ({ id, children }) => {
  const device = useDevice();
  const { data: session } = useSession();
  const playbackState = usePlaybackState(100);
  const { data, error, mutate } = useSWRImmutable<Playlist>(
    `/api/spotify/queue/${id}`,
    (url: string) =>
      fetch(url)
        .then(response => response.json())
        .then((playlist: Playlist) => {
          playlist.tracks = shuffle(playlist.tracks);
          return playlist;
        }),
  );
  const playTrack = useCallback(
    (uris: string[], position_ms: number) => {
      if (!device || !session || uris.length === 0) {
        return;
      }
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          position_ms,
          uris,
        }),
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }).catch(error => {
        console.error('>>> Failed to play tracks <<<', error);
      });
    },
    [device, session],
  );
  const setPosition = (position: number) => {
    if (!data) return;
    const i = Math.max(
      data.tracks.findIndex(track => ['playing', 'queued'].includes(track.state)),
      0,
    );
    playTrack(
      data.tracks.slice(i, i + QUEUE_SIZE).map(track => track.uri),
      position,
    );
  };
  useEffect(() => {
    if (!playbackState || !data) return;
    const name = playbackState.track_window.current_track.name;
    let playing = data.tracks.findIndex(track => track.name === name && track.state !== 'played');
    if (playing === -1) {
      mutate({
        ...data,
        position: playbackState.position,
        tracks: data.tracks.map((track, i) => ({
          ...track,
          state: i === 0 ? 'playing' : 'queued',
        })),
      });
    } else if (playbackState.track_window.next_tracks.length >= 0) {
      if (playbackState.paused && playbackState.position === 0) {
        playing++;
        if (playing >= data.tracks.length) {
          mutate().then(playlist =>
            playTrack(
              playlist!.tracks.slice(0, QUEUE_SIZE).map(track => track.uri),
              0,
            ),
          );
          return;
        }
      }
      mutate(
        {
          ...data,
          position: playbackState.position,
          tracks: data.tracks.map((track, i) => {
            if (i === playing) track.state = 'playing';
            else if (i < playing) track.state = 'played';
            else track.state = 'queued';
            return track;
          }),
        },
        false,
      );
    } else if (++playing < data.tracks.length) {
      playTrack(
        data.tracks.slice(playing, playing + QUEUE_SIZE).map(track => track.uri),
        0,
      );
    }
  }, [mutate, playbackState, playTrack, data]);
  return (
    <PlaylistContext.Provider
      value={{ data, error, loading: !error && !data, mutate, playTrack, setPosition }}
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
