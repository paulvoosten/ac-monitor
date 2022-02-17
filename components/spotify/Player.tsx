import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../../styles/Spotify.module.css';
import useSWRImmutable from 'swr';
import { shuffle } from '../../helpers/array';
import WebPlaybackState from '../../interfaces/WebPlaybackState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faShuffle,
  faVolumeHigh,
  faVolumeLow,
} from '@fortawesome/free-solid-svg-icons';
import { getSession, signOut } from 'next-auth/react';
import Track from './Track';
import Playlist from '../../interfaces/Playlist';
import { Session } from 'next-auth';
import ProgressBar from '../ProgressBar';
import ToggleMenu from '../ToggleMenu';

const storageKey = 'spotify-playlist';

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

const Player = ({ session }: { session: Session }) => {
  const homoMusicRef = useRef<NodeJS.Timeout>();
  const syncPlaylistRef = useRef<NodeJS.Timeout>();
  const timeRef = useRef<NodeJS.Timer>();
  const [active, setActive] = useState(false);
  const [deviceId, setDeviceId] = useState<string>();
  const [paused, setPaused] = useState(false);
  const [player, setPlayer] = useState();
  const [playHomoMusic, setPlayHomoMusic] = useState(false);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(50);
  const {
    data: playlist,
    error,
    mutate: mutatePlaylist,
  } = useSWRImmutable<Playlist>(
    '/api/spotify/queue?playlist=6cdEgnaFIU4dIPGeB4bM5v',
    (url: string) =>
      new Promise((resolve) => {
        const fallback = JSON.parse(localStorage.getItem(storageKey));
        if (fallback) {
          resolve(fallback);
          return;
        }
        fetch(url)
          .then((response) => response.json())
          .then((playlist: Playlist) => {
            playlist.tracks = shuffle(playlist.tracks);
            resolve(playlist);
            return playlist;
          })
          .catch((error) => {
            console.error('>>> Failed to fetch playlist <<<', error);
          });
      }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const startNewQueue = useCallback(() => {
    localStorage.removeItem(storageKey);
    mutatePlaylist().then((playlist) => {
      if (!playlist) {
        return;
      }
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: playlist.tracks.map((track) => track.uri),
        }),
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    });
  }, [deviceId, mutatePlaylist, session.accessToken]);
  const syncPlaylist = useCallback(() => {
    syncPlaylistRef.current = undefined;
    if (!playlist) {
      return;
    }
    fetch('/api/spotify/queue?playlist=6cdEgnaFIU4dIPGeB4bM5v')
      .then((response) => response.json())
      .then((newPlaylist: Playlist) => {
        const syncedPlaylist: Playlist = JSON.parse(JSON.stringify(playlist));
        let currentIndex = syncedPlaylist.tracks.findIndex(
          (track) => track.state === 'queued'
        );
        if (currentIndex === -1) {
          currentIndex = 0;
        }
        const currentUris = syncedPlaylist.tracks.map((track) => track.uri);
        const newUris: string[] = [];
        newPlaylist.tracks.forEach((track) => {
          newUris.push(track.uri);
          if (!currentUris.includes(track.uri)) {
            syncedPlaylist.tracks.splice(
              getRandomNumber(currentIndex, syncedPlaylist.tracks.length),
              0,
              track
            );
            currentUris.push(track.uri);
          }
        });
        syncedPlaylist.tracks = syncedPlaylist.tracks.filter((track) =>
          newUris.includes(track.uri)
        );
        mutatePlaylist(syncedPlaylist, false);
      });
  }, [mutatePlaylist, playlist]);
  useEffect(() => {
    if (!playlist) {
      return;
    }
    const queueLength = playlist.tracks.filter(
      (track) => track.state !== 'played'
    ).length;
    if (queueLength === 0) {
      startNewQueue();
    } else {
      if (!syncPlaylistRef.current) {
        syncPlaylistRef.current = setTimeout(syncPlaylist, 60000);
      }
      localStorage.setItem(storageKey, JSON.stringify(playlist));
    }
  }, [playlist, startNewQueue, syncPlaylist]);
  const getToken = async () => {
    const session = await getSession();
    if (!session) {
      throw Error('No session available');
    }
    return session.accessToken;
  };
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        getOAuthToken: async (callback: (token: string) => void) => {
          callback(await getToken());
        },
        name: 'AdCalls Dev-hok',
        volume: 0.5,
      });
      player.addListener('ready', ({ device_id }: { device_id: string }) =>
        setDeviceId(device_id)
      );
      player.addListener('player_state_changed', (state: WebPlaybackState) => {
        setActive(!!state);
        if (!state) {
          setPaused(true);
          return;
        }
        const currentUri =
          state.track_window.current_track.linked_from.uri ??
          state.track_window.current_track.uri;
        mutatePlaylist(async (playlist) => {
          if (!playlist) {
            return playlist;
          }
          const currentIndex = playlist.tracks.findIndex(
            (track) => track.uri === currentUri
          );
          if (currentIndex === -1) {
            return playlist;
          }
          return {
            ...playlist,
            tracks: playlist.tracks.map((track, index) => {
              if (index === currentIndex) {
                if (track.state !== 'playing' && track.isHomoMusic) {
                  if (homoMusicRef.current) {
                    clearTimeout(homoMusicRef.current);
                  }
                  homoMusicRef.current = setTimeout(() => {
                    setPlayHomoMusic(true);
                    homoMusicRef.current = undefined;
                  }, getRandomNumber(Math.min(30000, track.duration * 0.25), Math.min(90000, track.duration * 0.5)));
                }
                track.state = 'playing';
              } else if (index < currentIndex) {
                track.state = 'played';
              } else {
                track.state = 'queued';
              }
              return track;
            }),
          };
        }, false);
        setPaused(state.paused);
        setPosition(state.position);
      });
      setPlayer(player);
      player.connect();
    };
  }, []);
  useEffect(() => {
    if (active && !paused && !timeRef.current) {
      timeRef.current = setInterval(() => {
        setPosition((position) => position + 1000);
      }, 1000);
    } else if (paused && timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = undefined;
    }
  }, [active, paused]);
  if (error) {
    return <>Failed to load playlist: {error}</>;
  } else if (!player || !deviceId) {
    return <>Initialising player...</>;
  } else if (!playlist) {
    return <>Loading playlist...</>;
  }
  const queue = playlist.tracks.filter((track) => track.state !== 'played');
  return (
    <>
      {playHomoMusic && (
        <audio autoPlay onEnded={() => setPlayHomoMusic(false)}>
          <source src="/static/audio/Homo muziek.wav" type="audio/wav" />
        </audio>
      )}
      <ToggleMenu>
        <>
          Signed in as: {session.user?.email}
          <div className={styles.buttons}>
            <span onClick={() => signOut()}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              Logout
            </span>
            <span onClick={startNewQueue}>
              <FontAwesomeIcon icon={faShuffle} />
              Shuffle
            </span>
          </div>
          <div className={styles.volume}>
            <FontAwesomeIcon icon={faVolumeLow} />
            <ProgressBar
              value={volume}
              max={100}
              onClick={(volume) => {
                player.setVolume(volume / 100).then(() => setVolume(volume));
              }}
            />
            <FontAwesomeIcon icon={faVolumeHigh} />
          </div>
        </>
      </ToggleMenu>
      <div className={styles.player}>
        <div className={styles.tracks}>
          {queue.map((track, index) => {
            const isCurrent = index === 0;
            const currentIndex = index + playlist.tracks.length - queue.length;
            return (
              <Track
                key={track.uri}
                isCurrent={isCurrent}
                paused={!active || paused}
                position={position}
                setPosition={(position) => {
                  fetch(
                    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                    {
                      method: 'PUT',
                      body: JSON.stringify({
                        offset: { position: currentIndex },
                        position_ms: position,
                        uris: playlist.tracks.map((track) => track.uri),
                      }),
                      headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                      },
                    }
                  ).then(() => {
                    setPosition(position);
                  });
                }}
                togglePlay={
                  isCurrent
                    ? () => {
                        if (active) {
                          player.togglePlay();
                          return;
                        }
                        fetch(
                          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                          {
                            method: 'PUT',
                            body: JSON.stringify({
                              offset: { position: currentIndex },
                              position_ms: position,
                              uris: playlist.tracks.map((track) => track.uri),
                            }),
                            headers: {
                              Authorization: `Bearer ${session.accessToken}`,
                            },
                          }
                        );
                      }
                    : () => {
                        const newPlaylist = {
                          ...playlist,
                          tracks: playlist.tracks.map((track, index) => {
                            if (index < currentIndex) {
                              track.state = 'played';
                            } else {
                              track.state = 'queued';
                            }
                            return track;
                          }),
                        };
                        fetch(
                          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                          {
                            method: 'PUT',
                            body: JSON.stringify({
                              offset: { position: currentIndex },
                              uris: newPlaylist.tracks.map(
                                (track) => track.uri
                              ),
                            }),
                            headers: {
                              Authorization: `Bearer ${session.accessToken}`,
                            },
                          }
                        ).then(() => {
                          mutatePlaylist(newPlaylist, false);
                        });
                      }
                }
                track={track}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Player;
