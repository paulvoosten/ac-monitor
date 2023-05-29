import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { shuffle } from '../../../helpers/array';
import Playlist from '../../../interfaces/Playlist';
import { useDevice } from './Device';
import { useSession } from 'next-auth/react';
import { usePlaybackState } from './PlaybackState';

const QUEUE_SIZE = 3;

const PlaylistContext = createContext<
  | {
      data?: Playlist;
      error?: Error;
      loading: boolean;
      mutate: KeyedMutator<Playlist>;
      playTrack: (number: number, position: number, playlist?: Playlist | undefined) => void;
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
    (index: number, position: number, playlist: Playlist | undefined = data) => {
      if (!playlist || !device || !session) return;

      const uris = playlist.tracks.slice(index, index + QUEUE_SIZE).map(track => track.uri);
      if (!uris.length) return;

      console.log(uris);
      mutate({ ...playlist, playingTrack: index }, false);

      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device.id}`, {
        method: 'PUT',
        body: JSON.stringify({ position_ms: position, uris }),
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }).catch(error => {
        console.error('>>> Failed to play tracks <<<', error);
      });
    },
    [data, device, mutate, session],
  );

  const setPosition = (position: number) => {
    if (!data) return;
    playTrack(data.playingTrack, position);
  };

  useEffect(() => {
    if (!playbackState || !data) return;

    const name = playbackState.track_window.current_track.name;
    const artist = playbackState.track_window.current_track.artists[0].name;
    let currentTrack = data.tracks.findIndex(
      track => track.name === name && track.artist === artist,
    );

    console.log('position:', playbackState);
    // if (currentTrack < data.playingTrack) currentTrack = data.playingTrack;

    if (currentTrack === -1) {
      console.log('inside 1', currentTrack);
      // When the track is not found in the playlist (for example if another song is played
      // from a different spotify client), we set the playlist back to the beginning, so it
      // doesn't break when we want to start it again.
      mutate({ ...data, position: playbackState.position, playingTrack: 0 }, false);
    } else if (
      playbackState.paused &&
      playbackState.position === 0 &&
      playbackState.track_window.next_tracks.length === 0
    ) {
      console.log('inside 2', currentTrack);
      console.log(data.tracks);
      console.log(name, artist);
      // This means the last song in the queue has ended, so we either start a new
      // queue or we shuffle and restart the whole playlist
      if (currentTrack + QUEUE_SIZE >= data.tracks.length) {
        console.log('inside 3', currentTrack);
        // The whole playlist has ended
        mutate().then(playlist => playTrack(0, 0, playlist));
      } else {
        console.log('inside 4', currentTrack);
        playTrack(currentTrack + QUEUE_SIZE, 0);
      }
    } else {
      // console.log('inside 5', currentTrack);
      // Update the currently playing song in the cache
      mutate({ ...data, position: playbackState.position, playingTrack: currentTrack }, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState?.position]);

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
