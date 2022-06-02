import styles from '../../styles/Spotify.module.css';
import { usePlayer } from './providers/Player';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { usePlaylist } from './providers/Playlist';

const Playlists = ({
  setPlaylistId: setCurrentPlaylistId,
}: {
  setPlaylistId: (playlistId: string) => void;
}) => {
  const [playlistId, setPlaylistId] = useState('');
  const player = usePlayer();
  const { data: playlist } = usePlaylist();
  const { data: playlists, mutate: mutatePlaylists } = useSWR<
    {
      id: string;
      name: string;
      image: string;
    }[]
  >('spotify-playlists', () => {
    return playlist
      ? [
          {
            id: playlist.id,
            image: playlist.image,
            name: playlist.name,
          },
        ]
      : [];
  });
  useEffect(() => {
    if (!playlist) return;
    mutatePlaylists(playlists => {
      if (!playlists) return playlists;
      return [
        {
          id: playlist.id,
          name: playlist.name,
          image: playlist.image,
        },
        ...playlists.filter(previous => previous.id !== playlist.id),
      ];
    }, false);
  }, [mutatePlaylists, playlist]);
  if (!player || !playlists) return null;
  return (
    <div className={styles.playlists}>
      <h2>Playlists</h2>
      <div>
        <input value={playlistId} onChange={e => setPlaylistId(e.target.value)} />
        <button className={styles.button} onClick={() => setCurrentPlaylistId(playlistId)}>
          Play
        </button>
      </div>
      {playlists.length > 0 && (
        <>
          <h3>Previously played</h3>
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              className={styles.playlist}
              onClick={() => setCurrentPlaylistId(playlist.id)}
            >
              <Image alt={playlist.name} src={playlist.image} width={50} height={50} />
              <div className={styles.info}>{playlist.name}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default Playlists;
