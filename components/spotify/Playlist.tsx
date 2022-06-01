import React, { useCallback, useEffect } from 'react';
import styles from '../../styles/Spotify.module.css';
import Track from './Track';
import Playlist from '../../interfaces/Playlist';
import { usePlayer } from './providers/Player';
import { usePlaybackState } from './providers/PlaybackState';
import { useDevice } from './providers/Device';
import { usePlaylist } from './providers/Playlist';
import { useSession } from 'next-auth/react';

const Playlist = () => {
  const device = useDevice();
  const player = usePlayer();
  const playbackState = usePlaybackState(100);
  const { data: playlist, error, mutate: mutatePlaylist } = usePlaylist();
  const { data: session } = useSession();
  const playTrack = useCallback(
    (position: number, position_ms: number) => {
      if (
        !device ||
        !playlist ||
        !session ||
        position < 0 ||
        position > playlist.tracks.length - 1
      ) {
        return;
      }
      fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            position_ms,
            uris: [playlist.tracks[position].uri],
          }),
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      ).catch((error) => {
        console.error('>>> Failed to play track <<<', error);
      });
    },
    [device, playlist, session]
  );
  const setPosition = useCallback(
    (position_ms: number) => {
      if (!device || !playlist || !session) return;
      let position = playlist.tracks.findIndex((track) =>
        ['playing', 'queued'].includes(track.state)
      );
      if (position === -1) position = 0;
      playTrack(position, position_ms);
    },
    [device, playlist, session, playTrack]
  );
  const togglePlay = useCallback(() => {
    if (playbackState && player) {
      player.togglePlay();
      return;
    } else if (playlist) setPosition(playlist.position);
  }, [playbackState, player, playlist, setPosition]);
  useEffect(() => {
    if (!playbackState || !playlist) return;
    const name = playbackState.track_window.current_track.name;
    const artist = playbackState.track_window.current_track.artists[0].name;
    mutatePlaylist((playlist) => {
      if (!playlist) return playlist;
      const playing = playlist.tracks.findIndex(
        (track) => track.name === name && track.artist === artist
      );
      if (playing === -1) return;
      if (playlist.tracks[playing].state === 'playing') {
        if (
          playbackState.paused &&
          playbackState.position === 0 &&
          playing < playlist.tracks.length - 1
        ) {
          playTrack(playing + 1, 0);
        }
        return {
          ...playlist,
          position: playbackState.position,
        };
      }
      return {
        ...playlist,
        position: playbackState.position,
        tracks: playlist.tracks.map((track, i) => {
          if (i === playing) track.state = 'playing';
          else if (i < playing) track.state = 'played';
          else track.state = 'queued';
          return track;
        }),
      };
    }, false);
  }, [mutatePlaylist, playbackState, playlist, playTrack]);
  if (error) {
    console.error('>>> Failed to load playlist <<<', error);
    return <>Failed to load playlist</>;
  } else if (!session) return <>Loading session...</>;
  else if (!player || !device) return <>Initialising player...</>;
  else if (!playlist) return <>Loading playlist...</>;
  const queue = playlist.tracks.filter((track) => track.state !== 'played');
  let position = playlist.position;
  if (playbackState && playbackState.position !== 0) {
    position = playbackState.position;
  }
  return (
    <>
      <div className={styles.player}>
        <div className={styles.tracks}>
          {queue.map((track, i) => {
            const isCurrent = i === 0;
            const queued = i + playlist.tracks.length - queue.length;
            return (
              <Track
                key={track.uri}
                isCurrent={isCurrent}
                paused={playbackState?.paused ?? true}
                position={position}
                setPosition={setPosition}
                togglePlay={isCurrent ? togglePlay : () => playTrack(queued, 0)}
                track={track}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Playlist;
