import styles from '../../styles/Spotify.module.css';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import Track from '../../interfaces/Track';
import ProgressBar from '../ProgressBar';
import { usePlayer } from './providers/Player';
import { usePlaybackState } from './providers/PlaybackState';
import { useCallback } from 'react';
import { usePlaylist } from './providers/Playlist';

interface Props {
  track: Track;
  isCurrent: boolean;
  playlistIndex: number;
}

const Track = ({ track, isCurrent, playlistIndex }: Props) => {
  const player = usePlayer();
  const playbackState = usePlaybackState();
  const { data: playlist, playTrack } = usePlaylist();

  const togglePlay = useCallback(() => {
    if (playbackState && player) player.togglePlay();
    else if (playlist) playTrack(playlist.playingTrack, playlist.position);
  }, [playbackState, player, playlist, playTrack]);

  if (!player || !playlist) return null;

  const position = playbackState?.position ?? playlist.position ?? 0;
  const paused = playbackState?.paused ?? true;
  return (
    <div key={track.uri} className={styles.track}>
      <div className={styles.image}>
        <Image
          alt={track.name}
          src={track.image}
          width={isCurrent ? 84 : 50}
          height={isCurrent ? 84 : 50}
        />
        <FontAwesomeIcon
          icon={!isCurrent || paused ? faPlay : faPause}
          onClick={isCurrent ? togglePlay : () => playTrack(playlistIndex, 0)}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.nameArtist}>
          <div className={styles.name}>{track.name}</div>
          <div className={styles.artist}>{track.artist}</div>
        </div>
        {isCurrent && (
          <div className={styles.progressWrapper}>
            <div className={`${styles.time} ${styles.pre}`}>{formatTime(position)}</div>
            <ProgressBar
              value={position}
              max={track.duration}
              onClick={async position => await player.seek(position)}
            />
            <div className={`${styles.time} ${styles.post}`}>{formatTime(track.duration)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${returnedSeconds}`;
}

export default Track;
