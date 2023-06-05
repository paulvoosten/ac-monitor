import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';
import Playlist from '../../../interfaces/Playlist';
import { useDevice } from './Device';
import { useSession } from 'next-auth/react';
import { usePlaybackState } from './PlaybackState';

const QUEUE_SIZE = 500;

const PlaylistContext = createContext<
  | {
      data?: Playlist;
      error?: Error;
      loading: boolean;
      mutate: KeyedMutator<Playlist>;
      playTrack: (index: number, position: number, playlist?: Playlist | undefined) => void;
    }
  | undefined
>(undefined);

export const PlaylistProvider: React.FC<{ id: string }> = ({ id, children }) => {
  const device = useDevice();
  const { data: session } = useSession();
  const playbackState = usePlaybackState();

  const { data, error, mutate } = useSWRImmutable<Playlist>(
    `/api/spotify/queue/${id}`,
    (url: string) => fetch(url).then(response => response.json()),
  );

  const playTrack = useCallback(
    (index: number, position: number, playlist: Playlist | undefined = data) => {
      if (!playlist || !device || !session) return;

      const uris = playlist.tracks.slice(index, index + QUEUE_SIZE).map(track => track.uri);
      if (!uris.length) return;

      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device.id}`, {
        method: 'PUT',
        body: JSON.stringify({ position_ms: position, uris }),
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }).catch(error => console.error('>>> Failed to play tracks <<<', error));
    },
    [data, device, session],
  );

  useEffect(() => {
    if (!playbackState || !data) return;

    const name = playbackState.track_window.current_track.name;
    const artist = playbackState.track_window.current_track.artists[0].name;
    let playingTrack = data.tracks.findIndex(
      track => track.name === name && track.artist === artist,
    );

    if (playingTrack === -1) {
      // When the track is not found in the playlist (for example if another song is played
      // from a different spotify client), we set the playlist back to the beginning, so it
      // doesn't break when we want to start it again.
      mutate({ ...data, position: playbackState.position, playingTrack: 0 }, false);
    } else if (
      playbackState.paused &&
      playbackState.position === 0 &&
      playbackState.track_window.next_tracks.length === 0
    ) {
      // This means the last song in the queue has ended, so we either start a new
      // queue or we shuffle and restart the whole playlist
      const nextTrack = playingTrack + QUEUE_SIZE;
      if (nextTrack >= data.tracks.length) {
        // Re-fetch playlist after it ended to sync added and removed tracks
        mutate().then(playlist =>
          mutate(shuffle(playlist!), false).then(playlist => playTrack(0, 0, playlist)),
        );
      } else {
        playTrack(nextTrack, 0);
      }
    } else {
      // Update the currently playing song in the cache
      mutate({ ...data, position: playbackState.position, playingTrack }, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState?.position]);

  return (
    <PlaylistContext.Provider value={{ data, error, loading: !error && !data, mutate, playTrack }}>
      {children}
    </PlaylistContext.Provider>
  );
};

export function shuffle(playlist: Playlist): Playlist {
  const tracks = [...playlist.tracks];
  for (let i = tracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
  }
  return {
    ...playlist,
    tracks,
  };
}

export function usePlaylist() {
  const value = useContext(PlaylistContext);
  if (value === undefined) throw new Error('PlaylistProvider not available');
  return value;
}
