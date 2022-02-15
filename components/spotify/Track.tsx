import styles from '../../styles/Spotify.module.css';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import Track from '../../interfaces/Track';

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${returnedSeconds}`;
}

const Track = ({
  isCurrent,
  paused,
  position,
  togglePlay,
  track,
}: {
  isCurrent: boolean;
  paused: boolean;
  position: number;
  togglePlay?: () => void;
  track: Track;
}) => {
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
          onClick={togglePlay}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.nameArtist}>
          <div className={styles.name}>{track.name}</div>
          <div className={styles.artist}>{track.artist}</div>
        </div>
        {isCurrent && (
          <div className={styles.progressWrapper}>
            <div className={`${styles.time} ${styles.pre}`}>
              {formatTime(position)}
            </div>
            <div className={styles.progressBar}>
              <div
                style={{
                  width: `${(position / track.duration) * 100}%`,
                }}
                className={styles.progress}
              />
            </div>
            <div className={`${styles.time} ${styles.post}`}>
              {formatTime(track.duration)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
