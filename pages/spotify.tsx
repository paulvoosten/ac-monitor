import type { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import useScriptCache from '../components/ScriptCache';
import styles from '../styles/Spotify.module.css';
import Image from 'next/image';
import useSWRImmutable from 'swr';
import PlaybackState from '../interfaces/PlaybackState';
import { shuffle } from '../helpers/array';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${returnedSeconds}`;
}

// TODO: styling
const Spotify: NextPage = () => {
  const { data: session } = useSession();
  const homoMusicRef = useRef<NodeJS.Timeout>();
  const timeRef = useRef<NodeJS.Timer>();
  const [deviceId, setDeviceId] = useState<string>();
  const [paused, setPaused] = useState<boolean>();
  const [player, setPlayer] = useState();
  const [playHomoMusic, setPlayHomoMusic] = useState<boolean>();
  const [position, setPosition] = useState(0);
  const {
    data: playlist,
    error,
    mutate: mutatePlaylist,
  } = useSWRImmutable(
    '/api/spotify/queue?playlist=6cdEgnaFIU4dIPGeB4bM5v',
    (url: string) =>
      fetch(url)
        .then((response) => response.json())
        .then((playlist) => {
          playlist.tracks = shuffle(playlist.tracks);
          return playlist;
        }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  useScriptCache(!!session, [
    {
      src: 'https://sdk.scdn.co/spotify-player.js',
      onAdd: () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
          const spotifyPlayer = new window.Spotify.Player({
            getOAuthToken: (callback: (token: string) => void) => {
              callback(session?.accessToken);
            },
            name: 'AdCalls Dev-hok',
            volume: 0.5,
          });
          spotifyPlayer.addListener(
            'ready',
            ({ device_id }: { device_id: string }) => setDeviceId(device_id)
          );
          spotifyPlayer.addListener(
            'player_state_changed',
            (state: PlaybackState) => {
              const currentTrack = state.track_window.current_track;
              const currentUri =
                currentTrack.linked_from.uri ?? currentTrack.uri;
              mutatePlaylist(
                async (playlist: {
                  image: string;
                  tracks: {
                    duration: number;
                    isHomoMusic: boolean;
                    state: string;
                    uri: string;
                  }[];
                  uri: string;
                }) => {
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
                        if (track.state !== 'playing') {
                          if (playlist.tracks[currentIndex].isHomoMusic) {
                            if (homoMusicRef.current) {
                              clearTimeout(homoMusicRef.current);
                            }
                            // TODO: add random timer
                            const maxDelay = Math.min(
                              90000,
                              track.duration * 0.5
                            );
                            const minDelay = Math.min(
                              30000,
                              track.duration * 0.25
                            );
                            const delay = Math.floor(
                              Math.random() * (maxDelay - minDelay) + minDelay
                            );
                            console.log('>>> Playing homo muziek <<<', {
                              maxDelay,
                              minDelay,
                              delay,
                            });

                            homoMusicRef.current = setTimeout(() => {
                              setPlayHomoMusic(true);
                              homoMusicRef.current = undefined;
                            }, delay);
                          }
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
                },
                false
              );
              setPaused(state.paused);
              setPosition(state.position);
            }
          );
          spotifyPlayer.connect();
          setPlayer(spotifyPlayer);
        };
      },
    },
  ]);
  useEffect(() => {
    if (paused === false && !timeRef.current) {
      timeRef.current = setInterval(() => {
        setPosition((currentPosition) => currentPosition + 1000);
      }, 1000);
    } else if (paused && timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = undefined;
    }
  }, [paused]);
  useEffect(() => {
    if (player) {
      if (playHomoMusic === true) {
        player.pause();
      } else if (playHomoMusic === false) {
        setPlayHomoMusic(undefined);
        player.resume();
      }
    }
  }, [player, playHomoMusic]);
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signIn('spotify');
    }
  }, [session]);
  if (!session) {
    return (
      <>
        <h1>Not signed in yet</h1>
        <button onClick={() => signIn('spotify')}>Sign in</button>
      </>
    );
  } else if (error) {
    return `Failed to load playlist: ${error}`;
  } else if (!player) {
    return 'Not connected to player :(';
  } else if (!playlist) {
    return 'Loading playlist...';
  }
  const currentTrack =
    playlist.tracks.find(
      (track: { state: string }) => track.state === 'playing'
    ) ?? playlist.tracks[0];

  return (
    <>
      {playHomoMusic && (
        <audio autoPlay onEnded={() => setPlayHomoMusic(false)}>
          <source src="/static/audio/Homo muziek.wav" type="audio/wav" />
        </audio>
      )}
      Signed in in as: {session.user?.email}
      <button onClick={() => signOut()}>Sign out</button>
      <div className={styles.player}>
        <div>
          <button
            onClick={() => {
              mutatePlaylist(
                {
                  ...playlist,
                  tracks: playlist.tracks.map((track: object) => ({
                    ...track,
                    state: 'queued',
                  })),
                },
                false
              ).then((playlist) => {
                fetch(
                  `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                  {
                    method: 'PUT',
                    body: JSON.stringify({
                      uris: playlist.tracks.map(
                        (track: { uri: string }) => track.uri
                      ),
                    }),
                    headers: {
                      Authorization: `Bearer ${session.accessToken}`,
                    },
                  }
                );
              });
            }}
          >
            Restart queue
          </button>
          <button
            onClick={() => {
              mutatePlaylist().then((playlist) => {
                fetch(
                  `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                  {
                    method: 'PUT',
                    body: JSON.stringify({
                      uris: playlist.tracks.map(
                        (track: { uri: string }) => track.uri
                      ),
                    }),
                    headers: {
                      Authorization: `Bearer ${session.accessToken}`,
                    },
                  }
                );
              });
            }}
          >
            Start new queue
          </button>
        </div>
        <div className={styles.tracks}>
          {playlist.tracks.map(
            (
              track: {
                artist: string;
                duration: number;
                image: string;
                name: string;
                state: string;
              },
              index: number
            ) => {
              if (track.state === 'played') {
                return null;
              }
              const isCurrent =
                track.state === 'playing' ||
                (index === 0 && track.state === 'queued');
              return (
                <div
                  key={index}
                  className={
                    styles.track + (isCurrent ? ' ' + styles.current : '')
                  }
                >
                  <div className={styles.image}>
                    <Image
                      alt={track.name}
                      src={track.image}
                      width={250}
                      height={250}
                    />
                    {isCurrent && (
                      <FontAwesomeIcon
                        icon={paused ? faPlay : faPause}
                        onClick={() =>
                          paused ? player.resume() : player.pause()
                        }
                      />
                    )}
                  </div>
                  <div className={styles.info}>
                    <div>
                      <div className={styles.name}>{track.name}</div>
                      <div className={styles.artist}>{track.artist}</div>
                    </div>
                    {isCurrent && (
                      <>
                        <div className={styles.time}>
                          {formatTime(position)} / {formatTime(track.duration)}
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            style={{
                              width: `${(position / track.duration) * 100}%`,
                            }}
                            className={styles.progress}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </>
  );
};

export default Spotify;
