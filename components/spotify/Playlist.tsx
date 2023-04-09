import React, { useCallback } from 'react';
import styles from '../../styles/Spotify.module.css';
import Track from './Track';
import Playlist from '../../interfaces/Playlist';
import { usePlayer } from './providers/Player';
import { usePlaybackState } from './providers/PlaybackState';
import { QUEUE_SIZE, usePlaylist } from './providers/Playlist';
import { useSession } from 'next-auth/react';

const Playlist = () => {
  const player = usePlayer();
  const playbackState = usePlaybackState(100);
  const { data: playlist, error, playTrack, setPosition } = usePlaylist();
  const { data: session } = useSession();
  const togglePlay = useCallback(() => {
    if (playbackState && player) {
      player.togglePlay();
      return;
    } else if (playlist) setPosition(playlist.position);
  }, [playbackState, player, playlist, setPosition]);
  if (error) {
    console.error('>>> Failed to load playlist <<<', error);
    return <>Failed to load playlist</>;
  } else if (!session) return <>Loading session...</>;
  else if (!player) return <>Initialising player...</>;
  else if (!playlist) return <>Loading playlist...</>;
  const totalLength = playlist.tracks.length;
  const queue = playlist.tracks.filter(track => track.state !== 'played');
  const currentSongNumber = totalLength - queue.length + 1;
  let position = playlist.position;
  if (playbackState && playbackState.position !== 0) {
    position = playbackState.position;
  }
  return (
    <>
      <div className={styles.player}>
        <div className={styles.tracks}>
          {queue.slice(0, 10).map((track, i) => {
            const isCurrent = i === 0;
            const queued = i + totalLength - queue.length;
            return (
              <Track
                key={track.uri}
                isCurrent={isCurrent}
                paused={playbackState?.paused ?? true}
                position={position}
                setPosition={setPosition}
                togglePlay={
                  isCurrent
                    ? togglePlay
                    : () =>
                        playTrack(
                          playlist.tracks
                            .slice(queued, queued + QUEUE_SIZE)
                            .map(track => track.uri),
                          0,
                        )
                }
                track={track}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.total}>
        {currentSongNumber} / {totalLength}
      </div>
    </>
  );
};

export default Playlist;
