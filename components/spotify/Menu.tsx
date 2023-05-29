import ToggleMenu from '../ToggleMenu';
import styles from '../../styles/Spotify.module.css';
import { signOut, useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faShuffle,
  faVolumeHigh,
  faVolumeLow,
} from '@fortawesome/free-solid-svg-icons';
import ProgressBar from '../ProgressBar';
import { usePlayer } from './providers/Player';
import { useState } from 'react';
import Playlists from './Playlists';
import { INITIAL_VOLUME } from '../../pages/spotify';
import { usePlaylist } from './providers/Playlist';

const Menu = ({ setPlaylistId }: { setPlaylistId: (playlistId: string) => void }) => {
  const [volume, setVolume] = useState(INITIAL_VOLUME);
  const player = usePlayer();
  const { mutate: mutatePlaylist, playTrack } = usePlaylist();
  const { data: session } = useSession();
  if (!session) return null;
  return (
    <ToggleMenu>
      Signed in as: {session.user?.email}
      <div className={styles.buttons}>
        <span onClick={() => signOut()}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          Logout
        </span>
        <span onClick={() => mutatePlaylist().then(playlist => playTrack(0, 0, playlist))}>
          <FontAwesomeIcon icon={faShuffle} />
          Shuffle
        </span>
      </div>
      {player && (
        <div className={styles.volume}>
          <FontAwesomeIcon icon={faVolumeLow} />
          <ProgressBar
            value={volume}
            max={100}
            onClick={volume => {
              player.setVolume(volume / 100).then(() => setVolume(volume));
            }}
          />
          <FontAwesomeIcon icon={faVolumeHigh} />
        </div>
      )}
      <Playlists setPlaylistId={setPlaylistId} />
    </ToggleMenu>
  );
};

export default Menu;
