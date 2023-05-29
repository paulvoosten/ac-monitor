import React from 'react';
import styles from '../../styles/Spotify.module.css';
import Track from './Track';
import Playlist from '../../interfaces/Playlist';
import { usePlayer } from './providers/Player';
import { usePlaylist } from './providers/Playlist';
import { useSession } from 'next-auth/react';

const Playlist = () => {
  const player = usePlayer();
  const { data: playlist, error } = usePlaylist();
  const { data: session } = useSession();

  if (error) {
    console.error('>>> Failed to load playlist <<<', error);
    return <>Failed to load playlist</>;
  } else if (!session) return <>Loading session...</>;
  else if (!player) return <>Initialising player...</>;
  else if (!playlist) return <>Loading playlist...</>;

  const totalLength = playlist.tracks.length;
  const queue = playlist.tracks.slice(playlist.playingTrack);
  const currentSongNumber = totalLength - queue.length + 1;

  return (
    <>
      <div className={styles.player}>
        <div className={styles.tracks}>
          {queue.slice(0, 10).map((track, i) => {
            return (
              <Track
                key={track.uri}
                track={track}
                isCurrent={i === 0}
                playlistIndex={i + totalLength - queue.length}
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
